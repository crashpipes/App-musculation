import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { routineSchema } from "@/lib/validation";

export async function GET() {
  try {
    const userId = await requireUserId();
    const routines = await prisma.routine.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { exercise: true }
        }
      }
    });
    return NextResponse.json({ routines });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = routineSchema.parse(await req.json());

    // Vérifie que tous les exercices sont accessibles (préchargés ou possédés).
    const ids = data.exercises.map((e) => e.exerciseId);
    const accessible = await prisma.exercise.findMany({
      where: { id: { in: ids }, OR: [{ isPreset: true }, { userId }] },
      select: { id: true }
    });
    const okIds = new Set(accessible.map((e) => e.id));
    if (data.exercises.some((e) => !okIds.has(e.exerciseId))) {
      throw new Error("NOT_FOUND");
    }

    const routine = await prisma.routine.create({
      data: {
        userId,
        name: data.name,
        exercises: {
          create: data.exercises.map((e, i) => ({
            exerciseId: e.exerciseId,
            order: i,
            targetSets: e.targetSets,
            targetReps: e.targetReps
          }))
        }
      },
      include: { exercises: { include: { exercise: true } } }
    });

    return NextResponse.json({ routine }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
