"use client";

import Link from "next/link";
import { useState } from "react";
import { apiSend } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n";

export function WeeklyAnalysis() {
  const { t, locale } = useI18n();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await apiSend<{ analysis: string }>("/api/ai/weekly", "POST", { locale });
      setAnalysis(res.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{t("🧠 Analyse de la semaine", "🧠 Weekly analysis")}</h2>
        <Link href="/settings" className="text-xs text-brand-600 hover:underline">
          {t("Configurer l'IA", "Configure AI")}
        </Link>
      </div>
      <p className="text-sm text-[rgb(var(--muted))]">
        {t(
          "Un résumé IA de tes 7 derniers jours (nutrition, séances, poids).",
          "An AI summary of your last 7 days (nutrition, workouts, weight)."
        )}
      </p>

      {analysis && (
        <p className="whitespace-pre-line rounded-xl border border-[rgb(var(--border))] p-4 text-sm">
          {analysis}
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <button onClick={generate} disabled={loading} className="btn-primary">
        {loading
          ? t("Analyse en cours…", "Analysing…")
          : analysis
            ? t("Regénérer", "Regenerate")
            : t("Générer l'analyse", "Generate analysis")}
      </button>
    </div>
  );
}
