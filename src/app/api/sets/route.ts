import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workoutSetSchema } from "@/lib/validation";

// Historique récent des séries de l'utilisateur.
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
    const sets = await prisma.workoutSet.findMany({
      where: { session: { userId } },
      include: { exercise: true },
      orderBy: { date: "desc" },
      take: Math.min(Math.max(limit, 1), 200)
    });
    return NextResponse.json({ sets });
  } catch (error) {
    return handleApiError(error);
  }
}

// Enregistre une série dans la SÉANCE EN COURS (il faut en avoir démarré une).
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = workoutSetSchema.parse(await req.json());

    const exercise = await prisma.exercise.findFirst({
      where: { id: data.exerciseId, OR: [{ isPreset: true }, { userId }] }
    });
    if (!exercise) throw new Error("NOT_FOUND");

    const active = await prisma.workoutSession.findFirst({
      where: {
        userId,
        endedAt: null,
        date: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
      },
      orderBy: { date: "desc" }
    });
    if (!active) {
      return NextResponse.json(
        { error: "Aucune séance en cours. Démarre une séance d'abord.", code: "NO_ACTIVE_WORKOUT" },
        { status: 409 }
      );
    }

    const set = await prisma.workoutSet.create({
      data: {
        sessionId: active.id,
        exerciseId: data.exerciseId,
        sets: data.sets,
        reps: data.reps,
        weightKg: data.weightKg,
        notes: data.notes || null,
        date: new Date()
      },
      include: { exercise: true }
    });

    // Garde l'exercice dans la liste de la séance (si saisi sans l'avoir ajouté).
    const count = await prisma.sessionExercise.count({ where: { sessionId: active.id } });
    await prisma.sessionExercise.upsert({
      where: { sessionId_exerciseId: { sessionId: active.id, exerciseId: data.exerciseId } },
      create: { sessionId: active.id, exerciseId: data.exerciseId, order: count },
      update: {}
    });

    return NextResponse.json({ set }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
