import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startWorkoutSchema } from "@/lib/validation";

// Démarre une séance (ou renvoie celle déjà en cours).
// On peut passer un `routineId` pour pré-remplir la liste des exercices
// du programme (sans poids/répétitions, à saisir pendant la séance).
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();

    const raw = await req.json().catch(() => ({}));
    const data = startWorkoutSchema.parse(raw) ?? {};
    const routineId = data.routineId;

    let session = await prisma.workoutSession.findFirst({
      where: {
        userId,
        endedAt: null,
        date: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
      },
      orderBy: { date: "desc" },
      include: { exercises: true }
    });

    if (!session) {
      session = await prisma.workoutSession.create({
        data: { userId, routineId: routineId ?? null },
        include: { exercises: true }
      });
    }

    // Si un programme est fourni, on ajoute ses exercices à la séance
    // (sans dupliquer ceux déjà présents).
    if (routineId) {
      const routine = await prisma.routine.findFirst({
        where: { id: routineId, userId },
        include: { exercises: { orderBy: { order: "asc" } } }
      });
      if (!routine) throw new Error("NOT_FOUND");

      const existing = new Set(session.exercises.map((e) => e.exerciseId));
      const toAdd = routine.exercises.filter((e) => !existing.has(e.exerciseId));

      if (toAdd.length > 0) {
        const base = session.exercises.length;
        await prisma.sessionExercise.createMany({
          data: toAdd.map((e, i) => ({
            sessionId: session!.id,
            exerciseId: e.exerciseId,
            order: base + i,
            targetSets: e.targetSets,
            targetReps: e.targetReps
          })),
          skipDuplicates: true
        });
      }

      if (!session.routineId) {
        await prisma.workoutSession.update({
          where: { id: session.id },
          data: { routineId }
        });
      }
    }

    const full = await prisma.workoutSession.findUnique({
      where: { id: session.id },
      include: {
        sets: { orderBy: { date: "asc" }, include: { exercise: true } },
        exercises: { orderBy: { order: "asc" }, include: { exercise: true } }
      }
    });

    return NextResponse.json({ session: full }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
