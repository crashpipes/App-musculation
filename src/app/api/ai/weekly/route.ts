import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import { handleApiError } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { askAI, type AiProvider } from "@/lib/ai";
import { decryptSecret } from "@/lib/crypto";
import { computeTargets } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const isEn = body?.locale === "en";

    const setting = await prisma.aISetting.findUnique({ where: { userId } });
    if (!setting) {
      return NextResponse.json(
        { error: "Configure d'abord un fournisseur d'IA dans les réglages." },
        { status: 400 }
      );
    }

    const from = subDays(new Date(), 7);
    const [profile, logs, weights, sessions, sets] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.dailyLog.findMany({ where: { userId, date: { gte: from } }, orderBy: { date: "asc" } }),
      prisma.weightEntry.findMany({ where: { userId, date: { gte: from } }, orderBy: { date: "asc" } }),
      prisma.workoutSession.count({ where: { userId, endedAt: { not: null }, date: { gte: from } } }),
      prisma.workoutSet.findMany({
        where: { session: { userId }, date: { gte: from } },
        include: { exercise: true }
      })
    ]);

    const targets = profile
      ? computeTargets({
          sex: profile.sex,
          birthDate: profile.birthDate,
          heightCm: profile.heightCm,
          weightKg: profile.currentWeight,
          goal: profile.goal,
          activity: profile.activity
        })
      : null;

    const days = logs.length || 1;
    const avg = (sum: number) => Math.round(sum / days);
    const avgCal = avg(logs.reduce((s, l) => s + l.calories, 0));
    const avgPro = avg(logs.reduce((s, l) => s + l.proteinG, 0));
    const avgWater = avg(logs.reduce((s, l) => s + l.waterMl, 0));
    const firstW = weights[0]?.weightKg ?? null;
    const lastW = weights[weights.length - 1]?.weightKg ?? null;
    const weightDelta = firstW !== null && lastW !== null ? (lastW - firstW).toFixed(1) : "n/a";
    const exNames = Array.from(new Set(sets.map((s) => s.exercise.name))).join(", ") || "aucun";
    const totalVolume = Math.round(sets.reduce((s, x) => s + x.sets * x.reps * x.weightKg, 0));

    const data = [
      `Objectif: ${profile?.goal ?? "n/a"}`,
      `Cibles/jour: ${targets ? `${targets.calorieTarget} kcal, ${targets.proteinTargetG} g protéines, ${(targets.waterTargetMl / 1000).toFixed(1)} L eau` : "n/a"}`,
      `Moyennes 7j: ${avgCal} kcal, ${avgPro} g protéines, ${avgWater} ml eau`,
      `Séances: ${sessions}, volume total: ${totalVolume} kg`,
      `Exercices travaillés: ${exNames}`,
      `Variation de poids: ${weightDelta} kg`
    ].join("\n");

    const system = isEn
      ? "You are a sports coach. Analyse the user's past week and write a short (3-5 sentences), concrete and encouraging summary in English. Mention what went well and one thing to improve. Plain text only, no JSON."
      : "Tu es un coach sportif. Analyse la semaine de l'utilisateur et rédige un résumé court (3-5 phrases), concret et encourageant, en français. Mentionne ce qui va bien et un point à améliorer. Texte brut uniquement, pas de JSON.";

    const apiKey = decryptSecret(setting.apiKeyEnc);
    const analysis = await askAI({
      provider: setting.provider as AiProvider,
      apiKey,
      model: setting.model,
      system,
      user: data
    });

    return NextResponse.json({ analysis: analysis.trim() });
  } catch (error) {
    if (error instanceof Error && error.message === "AI_AUTH") {
      return NextResponse.json(
        { error: "Clé API refusée par le fournisseur. Vérifie ta clé dans les réglages." },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message.startsWith("AI_PROVIDER:")) {
      const rest = error.message.slice("AI_PROVIDER:".length);
      const sep = rest.indexOf(":");
      const detail = rest.slice(sep + 1);
      return NextResponse.json({ error: `Fournisseur : ${detail}` }, { status: 502 });
    }
    return handleApiError(error);
  }
}
