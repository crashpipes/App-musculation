import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exerciseSchema } from "@/lib/validation";

// Renvoie les exercices préchargés (partagés) + ceux de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const group = req.nextUrl.searchParams.get("group");
    const exercises = await prisma.exercise.findMany({
      where: {
        AND: [
          { OR: [{ isPreset: true }, { userId }] },
          ...(group ? [{ muscleGroup: group }] : [])
        ]
      },
      orderBy: [{ muscleGroup: "asc" }, { name: "asc" }]
    });
    return NextResponse.json({ exercises });
  } catch (error) {
    return handleApiError(error);
  }
}

// Crée un exercice personnalisé
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = exerciseSchema.parse(await req.json());

    // Vérifie que l'image éventuelle appartient bien à l'utilisateur
    if (data.imageUploadId) {
      const upload = await prisma.upload.findFirst({
        where: { id: data.imageUploadId, userId }
      });
      if (!upload) throw new Error("NOT_FOUND");
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: data.name,
        muscleGroup: data.muscleGroup,
        description: data.description || null,
        imageUploadId: data.imageUploadId ?? null,
        isPreset: false,
        userId
      }
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
