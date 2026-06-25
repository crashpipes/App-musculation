"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { BarTargetChart } from "@/components/charts/BarTargetChart";
import { LineProgressChart } from "@/components/charts/LineProgressChart";
import { ProgressRing } from "@/components/ProgressRing";
import { StatCard } from "@/components/StatCard";
import { apiGet } from "@/lib/fetcher";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardData>("/api/dashboard").then(setData).catch((e) =>
      setError(e.message)
    );
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-[rgb(var(--muted))]">Chargement…</p>;

  if (!data.profile || !data.targets) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <h2 className="text-xl font-bold">Complétez votre profil</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Renseignez vos informations pour calculer vos objectifs.
        </p>
        <Link href="/profile" className="btn-primary mt-4 inline-flex">
          Aller au profil
        </Link>
      </div>
    );
  }

  const { targets, todayLog, weights, logs, recentSets, streak, stats } = data;

  const weightSeries = weights.map((w) => ({
    label: format(new Date(w.date), "dd/MM", { locale: fr }),
    value: w.weightKg
  }));
  const calorieSeries = logs.map((l) => ({
    label: format(new Date(l.date), "dd/MM", { locale: fr }),
    value: l.calories
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          🔥 {streak} jour{streak > 1 ? "s" : ""} de suite
        </span>
      </div>

      {/* Anneaux de progression du jour */}
      <div className="card">
        <h2 className="mb-4 font-semibold">Aujourd&apos;hui</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ProgressRing
            label="Calories"
            unit=" kcal"
            value={todayLog?.calories ?? 0}
            target={targets.calorieTarget}
            color="#4f46e5"
          />
          <ProgressRing
            label="Protéines"
            unit=" g"
            value={todayLog?.proteinG ?? 0}
            target={targets.proteinTargetG}
            color="#16a34a"
          />
          <ProgressRing
            label="Eau"
            unit=" ml"
            value={todayLog?.waterMl ?? 0}
            target={targets.waterTargetMl}
            color="#0ea5e9"
          />
        </div>
        <div className="mt-4 text-center">
          <Link href="/tracking" className="btn-primary inline-flex">
            Enregistrer mes données
          </Link>
        </div>
      </div>

      {/* Statistiques clés */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Poids actuel"
          value={`${stats.lastWeight ?? data.profile.currentWeight} kg`}
        />
        <StatCard
          label="Évolution"
          value={
            stats.weightChange === null
              ? "—"
              : `${stats.weightChange > 0 ? "+" : ""}${stats.weightChange} kg`
          }
          hint={stats.daysTracked > 0 ? `sur ${stats.daysTracked} j` : undefined}
        />
        <StatCard label="Objectif calorique" value={`${targets.calorieTarget} kcal`} />
        <StatCard label="TDEE estimé" value={`${targets.tdee} kcal`} />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold">Évolution du poids</h2>
          <LineProgressChart data={weightSeries} color="#4f46e5" unit=" kg" />
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Calories (30 derniers jours)</h2>
          <BarTargetChart data={calorieSeries} color="#16a34a" />
        </div>
      </div>

      {/* Dernières séances */}
      <div className="card">
        <h2 className="mb-3 font-semibold">Dernières séries</h2>
        {recentSets.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            Aucune série enregistrée.{" "}
            <Link href="/exercises" className="text-brand-600 hover:underline">
              Commencer
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-[rgb(var(--border))]">
            {recentSets.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{s.exercise.name}</span>
                <span className="text-[rgb(var(--muted))]">
                  {s.reps} reps × {s.weightKg} kg ·{" "}
                  {format(new Date(s.date), "dd/MM", { locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
