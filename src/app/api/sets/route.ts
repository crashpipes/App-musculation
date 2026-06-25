import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workoutSetSchema } from "@/lib/validation";

// Historique récent des séries de l'utilisateur (dernières séances)
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

// Enregistre une série. Crée une session du jour si nécessaire.
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = workoutSetSchema.parse(await req.json());

    // Exercice accessible (préchargé ou possédé) ?
    const exercise = await prisma.exercise.findFirst({
      where: { id: data.exerciseId, OR: [{ isPreset: true }, { userId }] }
    });
    if (!exercise) throw new Error("NOT_FOUND");

    let sessionId = data.sessionId;
    if (sessionId) {
      const owned = await prisma.workoutSession.findFirst({
        where: { id: sessionId, userId }
      });
      if (!owned) throw new Error("NOT_FOUND");
    } else {
      const session = await prisma.workoutSession.create({
        data: { userId, date: data.date ?? new Date() }
      });
      sessionId = session.id;
    }

    const set = await prisma.workoutSet.create({
      data: {
        sessionId,
        exerciseId: data.exerciseId,
        setNumber: data.setNumber,
        reps: data.reps,
        weightKg: data.weightKg,
        notes: data.notes || null,
        date: data.date ?? new Date()
      },
      include: { exercise: true }
    });

    return NextResponse.json({ set }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
