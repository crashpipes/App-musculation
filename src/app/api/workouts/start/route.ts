import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Démarre une séance (ou renvoie celle déjà en cours).
export async function POST() {
  try {
    const userId = await requireUserId();
    let session = await prisma.workoutSession.findFirst({
      where: {
        userId,
        endedAt: null,
        date: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
      },
      orderBy: { date: "desc" }
    });
    if (!session) {
      session = await prisma.workoutSession.create({ data: { userId } });
    }
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
