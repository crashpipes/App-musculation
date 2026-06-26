import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { computeBadges } from "@/lib/badges";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();

    const [sessionCount, mealCount, logs, maxSet] = await Promise.all([
      prisma.workoutSession.count({ where: { userId } }),
      prisma.meal.count({ where: { userId } }),
      prisma.dailyLog.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: "asc" }
      }),
      prisma.workoutSet.findFirst({
        where: { session: { userId } },
        orderBy: { weightKg: "desc" },
        select: { weightKg: true }
      })
    ]);

    // Plus longue série de jours consécutifs avec un log.
    const days = logs.map((l) => l.date.toISOString().slice(0, 10));
    const set = new Set(days);
    let bestStreak = 0;
    for (const d of set) {
      const prev = new Date(d);
      prev.setUTCDate(prev.getUTCDate() - 1);
      if (set.has(prev.toISOString().slice(0, 10))) continue; // pas un début de série
      let len = 0;
      const cur = new Date(d);
      while (set.has(cur.toISOString().slice(0, 10))) {
        len++;
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      if (len > bestStreak) bestStreak = len;
    }

    const badges = computeBadges({
      sessionCount,
      bestStreak,
      mealCount,
      loggedDays: set.size,
      maxWeightLifted: maxSet?.weightKg ?? 0
    });

    return NextResponse.json({ badges });
  } catch (error) {
    return handleApiError(error);
  }
}
