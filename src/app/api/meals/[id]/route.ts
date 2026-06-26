import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Supprime un repas et décrémente le total du jour.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const meal = await prisma.meal.findFirst({
      where: { id: params.id, userId }
    });
    if (!meal) throw new Error("NOT_FOUND");

    await prisma.$transaction([
      prisma.meal.delete({ where: { id: meal.id } }),
      prisma.dailyLog.updateMany({
        where: { userId, date: meal.date },
        data: {
          calories: { decrement: meal.calories },
          proteinG: { decrement: meal.proteinG }
        }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
