import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { computeTargets } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/utils";

/** Agrège toutes les données nécessaires au tableau de bord en une requête. */
export async function GET() {
  try {
    const userId = await requireUserId();

    const [profile, logs, weights, recentSets] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.dailyLog.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 60
      }),
      prisma.weightEntry.findMany({
        where: { userId },
        orderBy: { date: "asc" }
      }),
      prisma.workoutSet.findMany({
        where: { session: { userId } },
        include: { exercise: true },
        orderBy: { date: "desc" },
        take: 8
      })
    ]);

    const targets = profile
      ? computeTargets({
          sex: profile.sex,
          birthDate: profile.birthDate,
          heightCm: profile.heightCm,
          weightKg: profile.currentWeight,
          goal: profile.goal,
          activity: profile.activity
        })
      : null;

    const today = todayKey().toISOString().slice(0, 10);
    const todayLog =
      logs.find((l) => l.date.toISOString().slice(0, 10) === today) ?? null;

    // Streak : nombre de jours consécutifs (jusqu'à aujourd'hui) avec un log
    const loggedDays = new Set(
      logs.map((l) => l.date.toISOString().slice(0, 10))
    );
    let streak = 0;
    const cursor = todayKey();
    while (loggedDays.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    // Tolère l'absence de log aujourd'hui mais présence hier
    if (streak === 0) {
      const yesterday = todayKey();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const cur = yesterday;
      while (loggedDays.has(cur.toISOString().slice(0, 10))) {
        streak++;
        cur.setUTCDate(cur.getUTCDate() - 1);
      }
    }

    const firstWeight = weights[0]?.weightKg ?? null;
    const lastWeight = weights[weights.length - 1]?.weightKg ?? null;
    const weightChange =
      firstWeight !== null && lastWeight !== null
        ? Number((lastWeight - firstWeight).toFixed(1))
        : null;

    const daysTracked =
      weights.length > 1
        ? differenceInCalendarDays(
            new Date(weights[weights.length - 1]!.date),
            new Date(weights[0]!.date)
          )
        : 0;

    return NextResponse.json({
      profile,
      targets,
      todayLog,
      logs: logs.slice(0, 30).reverse(),
      weights,
      recentSets,
      streak,
      stats: { firstWeight, lastWeight, weightChange, daysTracked }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
