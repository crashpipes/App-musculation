import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDayStart, todayKey } from "@/lib/utils";
import { dailyLogSchema } from "@/lib/validation";

// Liste des logs (optionnellement depuis ?from=YYYY-MM-DD)
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const fromParam = req.nextUrl.searchParams.get("from");
    const where = {
      userId,
      ...(fromParam ? { date: { gte: toDayStart(fromParam) } } : {})
    };
    const logs = await prisma.dailyLog.findMany({
      where,
      orderBy: { date: "asc" }
    });
    return NextResponse.json({ logs });
  } catch (error) {
    return handleApiError(error);
  }
}

// Upsert du log d'une journée (par défaut aujourd'hui)
export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const input = dailyLogSchema.parse(await req.json());
    const date = input.date ? toDayStart(input.date) : todayKey();

    const log = await prisma.dailyLog.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        calories: input.calories,
        proteinG: input.proteinG,
        waterMl: input.waterMl
      },
      update: {
        calories: input.calories,
        proteinG: input.proteinG,
        waterMl: input.waterMl
      }
    });

    return NextResponse.json({ log });
  } catch (error) {
    return handleApiError(error);
  }
}
