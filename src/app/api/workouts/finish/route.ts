import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Termine TOUTES les séances ouvertes de l'utilisateur :
// - supprime celles qui sont vides (aucune série) ;
// - clôture les autres (endedAt = maintenant) sans toucher aux données.
// Cela règle aussi le cas des anciennes séances restées "ouvertes".
export async function POST() {
  try {
    const userId = await requireUserId();

    await prisma.workoutSession.deleteMany({
      where: { userId, endedAt: null, sets: { none: {} } }
    });
    await prisma.workoutSession.updateMany({
      where: { userId, endedAt: null },
      data: { endedAt: new Date() }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
