import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { estimateNutrition, type AiProvider } from "@/lib/ai";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { aiEstimateSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const input = aiEstimateSchema.parse(await req.json());

    const setting = await prisma.aISetting.findUnique({ where: { userId } });
    if (!setting) {
      return NextResponse.json(
        { error: "Configure d'abord un fournisseur d'IA dans les réglages." },
        { status: 400 }
      );
    }

    const apiKey = decryptSecret(setting.apiKeyEnc);
    const result = await estimateNutrition({
      provider: setting.provider as AiProvider,
      apiKey,
      model: setting.model,
      mode: input.mode,
      imageBase64: input.imageBase64,
      mimeType: input.mimeType,
      foods: input.foods
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof Error && error.message === "AI_AUTH") {
      return NextResponse.json(
        { error: "Clé API refusée par le fournisseur. Vérifie ta clé dans les réglages." },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message.startsWith("AI_PROVIDER")) {
      return NextResponse.json(
        { error: "Le fournisseur d'IA a renvoyé une erreur. Réessaie plus tard." },
        { status: 502 }
      );
    }
    return handleApiError(error);
  }
}
