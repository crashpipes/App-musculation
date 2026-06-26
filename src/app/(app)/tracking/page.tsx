"use client";

import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { AIEstimator } from "@/components/AIEstimator";
import { LineProgressChart } from "@/components/charts/LineProgressChart";
import { ProgressRing } from "@/components/ProgressRing";
import { apiGet, apiSend } from "@/lib/fetcher";
import type { DailyLog, Meal, WeightEntry } from "@prisma/client";
import type { ProfileResponse } from "@/types";

type Range = 7 | 30 | 90;

function localDay(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export default function TrackingPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [targets, setTargets] = useState<ProfileResponse["targets"]>(null);
  const [range, setRange] = useState<Range>(7);
  const [msg, setMsg] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [waterAmount, setWaterAmount] = useState("");
  const [weightKg, setWeightKg] = useState("");

  async function load() {
    const day = localDay();
    const [logRes, mealRes, weightRes, profileRes] = await Promise.all([
      apiGet<{ logs: DailyLog[] }>("/api/logs"),
      apiGet<{ meals: Meal[] }>(`/api/meals?day=${day}`),
      apiGet<{ entries: WeightEntry[] }>("/api/weight"),
      apiGet<ProfileResponse>("/api/profile")
    ]);
    setLogs(logRes.logs);
    setMeals(mealRes.meals);
    setWeights(weightRes.entries);
    setTargets(profileRes.targets);
  }

  useEffect(() => {
    load();
  }, []);

  const todayLog = useMemo(() => {
    const day = localDay();
    return logs.find((l) => new Date(l.date).toISOString().slice(0, 10) === day) ?? null;
  }, [logs]);

  async function addMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!calories && !proteinG) return;
    setMsg(null);
    await apiSend("/api/meals", "POST", {
      day: localDay(),
      label: label || undefined,
      calories: Number(calories || 0),
      proteinG: Number(proteinG || 0)
    });
    setLabel("");
    setCalories("");
    setProteinG("");
    setMsg("Repas ajouté ✓");
    load();
  }

  async function deleteMeal(id: string) {
    await apiSend(`/api/meals/${id}`, "DELETE");
    load();
  }

  async function addWater(amount: number) {
    if (amount <= 0) return;
    await apiSend("/api/water", "POST", { day: localDay(), amountMl: amount });
    setWaterAmount("");
    load();
  }

  async function saveWeight(e: React.FormEvent) {
    e.preventDefault();
    if (!weightKg) return;
    await apiSend("/api/weight", "POST", { weightKg: Number(weightKg) });
    setWeightKg("");
    setMsg("Poids enregistré ✓");
    load();
  }

  const from = useMemo(() => subDays(new Date(), range), [range]);

  const calorieSeries = logs
    .filter((l) => new Date(l.date) >= from)
    .map((l) => ({
      label: format(new Date(l.date), "dd/MM", { locale: fr }),
      value: l.calories
    }));
  const proteinSeries = logs
    .filter((l) => new Date(l.date) >= from)
    .map((l) => ({
      label: format(new Date(l.date), "dd/MM", { locale: fr }),
      value: l.proteinG
    }));
  const weightSeries = weights
    .filter((w) => new Date(w.date) >= from)
    .map((w) => ({
      label: format(new Date(w.date), "dd/MM", { locale: fr }),
      value: w.weightKg
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Suivi quotidien</h1>

      {targets && (
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
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={addMeal} className="card space-y-4 lg:col-span-2">
          <h2 className="font-semibold">Ajouter un repas</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Chaque repas s&apos;ajoute au total de la journée.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Repas (optionnel)</label>
              <input
                className="input"
                placeholder="Petit-déjeuner…"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <NumField label="Calories (kcal)" value={calories} onChange={setCalories} />
            <NumField label="Protéines (g)" value={proteinG} onChange={setProteinG} />
          </div>
          <button type="submit" className="btn-primary">Ajouter le repas</button>
        </form>

        <div className="card space-y-4">
          <h2 className="font-semibold">Ajouter de l&apos;eau</h2>
          <div className="flex flex-wrap gap-2">
            {[250, 500, 750].map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => addWater(ml)}
                className="btn-ghost text-sm"
              >
                +{ml} ml
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              className="input"
              placeholder="ml"
              value={waterAmount}
              onChange={(e) => setWaterAmount(e.target.value)}
            />
            <button
              type="button"
              onClick={() => addWater(Number(waterAmount || 0))}
              className="btn-primary"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <AIEstimator day={localDay()} onAdded={load} />

      <div className="card">
        <h2 className="mb-3 font-semibold">Repas d&apos;aujourd&apos;hui</h2>
        {meals.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Aucun repas enregistré aujourd&apos;hui.</p>
        ) : (
          <ul className="divide-y divide-[rgb(var(--border))]">
            {meals.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{m.label || "Repas"}</span>
                <span className="flex items-center gap-3 text-[rgb(var(--muted))]">
                  {m.calories} kcal · {m.proteinG} g
                  <button
                    onClick={() => deleteMeal(m.id)}
                    className="text-red-500 hover:underline"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={saveWeight} className="card space-y-4">
        <h2 className="font-semibold">Poids du jour</h2>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step="0.1"
            className="input"
            placeholder="kg"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
          <button type="submit" className="btn-primary">Ajouter</button>
        </div>
      </form>

      {msg && <p className="text-sm text-green-600">{msg}</p>}

      <div className="flex items-center gap-2">
        <span className="text-sm text-[rgb(var(--muted))]">Période :</span>
        {([7, 30, 90] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={range === r ? "btn-primary !py-1.5 text-xs" : "btn-ghost !py-1.5 text-xs"}
          >
            {r === 7 ? "Semaine" : r === 30 ? "Mois" : "3 mois"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold">Calories</h2>
          <LineProgressChart data={calorieSeries} color="#4f46e5" unit=" kcal" />
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Protéines</h2>
          <LineProgressChart data={proteinSeries} color="#16a34a" unit=" g" />
        </div>
        <div className="card lg:col-span-2">
          <h2 className="mb-2 font-semibold">Poids</h2>
          <LineProgressChart data={weightSeries} color="#0ea5e9" unit=" kg" />
        </div>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={0}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
