import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weightEntrySchema } from "@/lib/validation";

export async function GET() {
  try {
    const userId = await requireUserId();
    const entries = await prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "asc" }
    });
    return NextResponse.json({ entries });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { weightKg, date } = weightEntrySchema.parse(await req.json());

    const entry = await prisma.weightEntry.create({
      data: { userId, weightKg, ...(date ? { date } : {}) }
    });

    // Met à jour le poids courant du profil
    await prisma.profile.updateMany({
      where: { userId },
      data: { currentWeight: weightKg }
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
