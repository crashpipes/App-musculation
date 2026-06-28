import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionExerciseSchema } from "@/lib/validation";

// Ajoute un exercice à la séance en cours (sans poids).
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = sessionExerciseSchema.parse(await req.json());

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
      orderBy: { date: "desc" },
      include: { exercises: true }
    });
    if (!active) {
      return NextResponse.json(
        { error: "Aucune séance en cours. Démarre une séance d'abord.", code: "NO_ACTIVE_WORKOUT" },
        { status: 409 }
      );
    }

    // Déjà présent : on renvoie l'existant (idempotent).
    const existing = active.exercises.find((e) => e.exerciseId === data.exerciseId);
    if (existing) {
      const item = await prisma.sessionExercise.findUnique({
        where: { id: existing.id },
        include: { exercise: true }
      });
      return NextResponse.json({ sessionExercise: item }, { status: 200 });
    }

    const order = active.exercises.length;
    const item = await prisma.sessionExercise.create({
      data: {
        sessionId: active.id,
        exerciseId: data.exerciseId,
        order,
        targetSets: data.targetSets ?? null,
        targetReps: data.targetReps ?? null
      },
      include: { exercise: true }
    });

    return NextResponse.json({ sessionExercise: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
