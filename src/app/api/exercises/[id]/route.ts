import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exerciseSchema } from "@/lib/validation";

// Détail d'un exercice + historique des performances + record personnel
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const exercise = await prisma.exercise.findFirst({
      where: { id: params.id, OR: [{ isPreset: true }, { userId }] }
    });
    if (!exercise) throw new Error("NOT_FOUND");

    // Séries de l'utilisateur uniquement (via ses sessions)
    const sets = await prisma.workoutSet.findMany({
      where: { exerciseId: exercise.id, session: { userId } },
      orderBy: { date: "asc" }
    });

    const pr = sets.reduce((max, s) => (s.weightKg > max ? s.weightKg : max), 0);

    return NextResponse.json({ exercise, sets, personalRecord: pr });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const owned = await prisma.exercise.findFirst({
      where: { id: params.id, userId, isPreset: false }
    });
    if (!owned) throw new Error("NOT_FOUND");

    const data = exerciseSchema.parse(await req.json());
    const exercise = await prisma.exercise.update({
      where: { id: params.id },
      data: {
        name: data.name,
        muscleGroup: data.muscleGroup,
        description: data.description || null,
        imageUploadId: data.imageUploadId ?? null
      }
    });
    return NextResponse.json({ exercise });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const owned = await prisma.exercise.findFirst({
      where: { id: params.id, userId, isPreset: false }
    });
    if (!owned) throw new Error("NOT_FOUND");

    await prisma.exercise.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
