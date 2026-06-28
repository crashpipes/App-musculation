import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Renvoie la séance en cours (non terminée), avec ses séries et exercices, ou null.
export async function GET() {
  try {
    const userId = await requireUserId();
    const session = await prisma.workoutSession.findFirst({
      where: {
        userId,
        endedAt: null,
        date: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
      },
      orderBy: { date: "desc" },
      include: {
        sets: { orderBy: { date: "asc" }, include: { exercise: true } },
        exercises: { orderBy: { order: "asc" }, include: { exercise: true } }
      }
    });
    return NextResponse.json({ session });
  } catch (error) {
    return handleApiError(error);
  }
}
