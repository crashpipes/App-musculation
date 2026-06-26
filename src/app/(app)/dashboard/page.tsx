"use client";

import Link from "next/link";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { BarTargetChart } from "@/components/charts/BarTargetChart";
import { LineProgressChart } from "@/components/charts/LineProgressChart";
import { ProgressRing } from "@/components/ProgressRing";
import { StatCard } from "@/components/StatCard";
import { apiGet } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const dl = locale === "en" ? enUS : fr;
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardData>("/api/dashboard").then(setData).catch((e) =>
      setError(e.message)
    );
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-[rgb(var(--muted))]">{t("Chargement…", "Loading…")}</p>;

  if (!data.profile || !data.targets) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <h2 className="text-xl font-bold">
          {t("Complétez votre profil", "Complete your profile")}
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          {t(
            "Renseignez vos informations pour calculer vos objectifs.",
            "Fill in your information to calculate your targets."
          )}
        </p>
        <Link href="/profile" className="btn-primary mt-4 inline-flex">
          {t("Aller au profil", "Go to profile")}
        </Link>
      </div>
    );
  }

  const { targets, todayLog, weights, logs, recentSets, streak, stats } = data;

  const weightSeries = weights.map((w) => ({
    label: format(new Date(w.date), "dd/MM", { locale: dl }),
    value: w.weightKg
  }));
  const calorieSeries = logs.map((l) => ({
    label: format(new Date(l.date), "dd/MM", { locale: dl }),
    value: l.calories
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("Tableau de bord", "Dashboard")}</h1>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          🔥 {streak}{" "}
          {t(`jour${streak > 1 ? "s" : ""} de suite`, `day${streak > 1 ? "s" : ""} streak`)}
        </span>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">{t("Aujourd'hui", "Today")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ProgressRing
            label={t("Calories", "Calories")}
            unit=" kcal"
            value={todayLog?.calories ?? 0}
            target={targets.calorieTarget}
            color="#4f46e5"
          />
          <ProgressRing
            label={t("Protéines", "Protein")}
            unit=" g"
            value={todayLog?.proteinG ?? 0}
            target={targets.proteinTargetG}
            color="#16a34a"
          />
          <ProgressRing
            label={t("Eau", "Water")}
            unit=" ml"
            value={todayLog?.waterMl ?? 0}
            target={targets.waterTargetMl}
            color="#0ea5e9"
          />
        </div>
        <div className="mt-4 text-center">
          <Link href="/tracking" className="btn-primary inline-flex">
            {t("Enregistrer mes données", "Log my data")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("Poids actuel", "Current weight")}
          value={`${stats.lastWeight ?? data.profile.currentWeight} kg`}
        />
        <StatCard
          label={t("Évolution", "Change")}
          value={
            stats.weightChange === null
              ? "—"
              : `${stats.weightChange > 0 ? "+" : ""}${stats.weightChange} kg`
          }
          hint={
            stats.daysTracked > 0
              ? t(`sur ${stats.daysTracked} j`, `over ${stats.daysTracked}d`)
              : undefined
          }
        />
        <StatCard label={t("Objectif calorique", "Calorie target")} value={`${targets.calorieTarget} kcal`} />
        <StatCard label={t("TDEE estimé", "Estimated TDEE")} value={`${targets.tdee} kcal`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold">{t("Évolution du poids", "Weight progress")}</h2>
          <LineProgressChart data={weightSeries} color="#4f46e5" unit=" kg" />
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">
            {t("Calories (30 derniers jours)", "Calories (last 30 days)")}
          </h2>
          <BarTargetChart data={calorieSeries} color="#16a34a" />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">{t("Dernières séries", "Latest sets")}</h2>
        {recentSets.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            {t("Aucune série enregistrée.", "No sets logged yet.")}{" "}
            <Link href="/exercises" className="text-brand-600 hover:underline">
              {t("Commencer", "Start")}
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-[rgb(var(--border))]">
            {recentSets.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{s.exercise.name}</span>
                <span className="text-[rgb(var(--muted))]">
                  {s.sets} × {s.reps} @ {s.weightKg} kg ·{" "}
                  {format(new Date(s.date), "dd/MM", { locale: dl })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
