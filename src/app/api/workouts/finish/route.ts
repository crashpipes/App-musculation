import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Termine la séance en cours. Si elle est vide, on la supprime.
export async function POST() {
  try {
    const userId = await requireUserId();
    const active = await prisma.workoutSession.findFirst({
      where: {
        userId,
        endedAt: null,
        date: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
      },
      orderBy: { date: "desc" }
    });
    if (!active) return NextResponse.json({ ok: true });

    const setCount = await prisma.workoutSet.count({ where: { sessionId: active.id } });
    if (setCount === 0) {
      await prisma.workoutSession.delete({ where: { id: active.id } });
      return NextResponse.json({ ok: true, deleted: true });
    }

    await prisma.workoutSession.update({
      where: { id: active.id },
      data: { endedAt: new Date() }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
