import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { DEFAULT_MODELS } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { aiSettingsSchema } from "@/lib/validation";

// Renvoie la config IA SANS jamais exposer la clé.
export async function GET() {
  try {
    const userId = await requireUserId();
    const setting = await prisma.aISetting.findUnique({ where: { userId } });
    return NextResponse.json({
      provider: setting?.provider ?? null,
      model: setting?.model ?? null,
      hasKey: !!setting
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Enregistre/met à jour le fournisseur + la clé (chiffrée).
export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { provider, apiKey, model } = aiSettingsSchema.parse(await req.json());
    const apiKeyEnc = encryptSecret(apiKey);
    const finalModel = model || DEFAULT_MODELS[provider];

    await prisma.aISetting.upsert({
      where: { userId },
      create: { userId, provider, apiKeyEnc, model: finalModel },
      update: { provider, apiKeyEnc, model: finalModel }
    });

    return NextResponse.json({ ok: true, provider, model: finalModel, hasKey: true });
  } catch (error) {
    return handleApiError(error);
  }
}

// Supprime la configuration IA.
export async function DELETE() {
  try {
    const userId = await requireUserId();
    await prisma.aISetting.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
