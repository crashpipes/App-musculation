import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDayStart, todayKey } from "@/lib/utils";
import { waterSchema } from "@/lib/validation";

// Ajoute une quantité d'eau qui s'additionne sur la journée.
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const input = waterSchema.parse(await req.json());
    const day = input.day ? toDayStart(input.day) : todayKey();

    const log = await prisma.dailyLog.upsert({
      where: { userId_date: { userId, date: day } },
      create: {
        userId,
        date: day,
        calories: 0,
        proteinG: 0,
        waterMl: input.amountMl
      },
      update: { waterMl: { increment: input.amountMl } }
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
