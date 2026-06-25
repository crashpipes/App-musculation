import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { computeTargets } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";

export async function GET() {
  try {
    const userId = await requireUserId();
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ profile: null, targets: null });

    const targets = computeTargets({
      sex: profile.sex,
      birthDate: profile.birthDate,
      heightCm: profile.heightCm,
      weightKg: profile.currentWeight,
      goal: profile.goal,
      activity: profile.activity
    });

    return NextResponse.json({ profile, targets });
  } catch (error) {
    return handleApiError(error);
  }
}

// Crée ou met à jour le profil (upsert)
export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = profileSchema.parse(await req.json());

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data }
    });

    // Enregistre aussi le poids actuel comme point de suivi
    await prisma.weightEntry.create({
      data: { userId, weightKg: data.currentWeight }
    });

    const targets = computeTargets({
      sex: profile.sex,
      birthDate: profile.birthDate,
      heightCm: profile.heightCm,
      weightKg: profile.currentWeight,
      goal: profile.goal,
      activity: profile.activity
    });

    return NextResponse.json({ profile, targets });
  } catch (error) {
    return handleApiError(error);
  }
}
