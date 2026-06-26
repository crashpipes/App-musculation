import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDayStart, todayKey } from "@/lib/utils";
import { mealSchema } from "@/lib/validation";

// Liste les repas d'une journée (?day=YYYY-MM-DD, par défaut aujourd'hui).
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const dayParam = req.nextUrl.searchParams.get("day");
    const day = dayParam ? toDayStart(dayParam) : todayKey();

    const meals = await prisma.meal.findMany({
      where: { userId, date: day },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ meals });
  } catch (error) {
    return handleApiError(error);
  }
}

// Ajoute un repas : crée la ligne Meal ET incrémente le total du jour (DailyLog).
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const input = mealSchema.parse(await req.json());
    const day = input.day ? toDayStart(input.day) : todayKey();
    const carbsG = input.carbsG ?? 0;
    const fatG = input.fatG ?? 0;

    const [meal] = await prisma.$transaction([
      prisma.meal.create({
        data: {
          userId,
          date: day,
          label: input.label || null,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG,
          fatG
        }
      }),
      prisma.dailyLog.upsert({
        where: { userId_date: { userId, date: day } },
        create: {
          userId,
          date: day,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG,
          fatG,
          waterMl: 0
        },
        update: {
          calories: { increment: input.calories },
          proteinG: { increment: input.proteinG },
          carbsG: { increment: carbsG },
          fatG: { increment: fatG }
        }
      })
    ]);

    return NextResponse.json({ meal }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
