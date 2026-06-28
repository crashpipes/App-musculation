import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Retire un exercice de la séance en cours. Supprime aussi les séries
// éventuellement déjà saisies pour cet exercice dans cette séance.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();

    const item = await prisma.sessionExercise.findFirst({
      where: { id: params.id, session: { userId } },
      select: { id: true, sessionId: true, exerciseId: true }
    });
    if (!item) throw new Error("NOT_FOUND");

    await prisma.$transaction([
      prisma.workoutSet.deleteMany({
        where: { sessionId: item.sessionId, exerciseId: item.exerciseId }
      }),
      prisma.sessionExercise.delete({ where: { id: item.id } })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
