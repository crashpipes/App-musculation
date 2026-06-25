"use client";

import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { LineProgressChart } from "@/components/charts/LineProgressChart";
import { apiGet, apiSend } from "@/lib/fetcher";
import type { DailyLog, WeightEntry } from "@prisma/client";
import type { ProfileResponse } from "@/types";

type Range = 7 | 30 | 90;

export default function TrackingPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [targets, setTargets] = useState<ProfileResponse["targets"]>(null);
  const [range, setRange] = useState<Range>(7);
  const [msg, setMsg] = useState<string | null>(null);

  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [waterMl, setWaterMl] = useState("");
  const [weightKg, setWeightKg] = useState("");

  async function load() {
    const [logRes, weightRes, profileRes] = await Promise.all([
      apiGet<{ logs: DailyLog[] }>("/api/logs"),
      apiGet<{ entries: WeightEntry[] }>("/api/weight"),
      apiGet<ProfileResponse>("/api/profile")
    ]);
    setLogs(logRes.logs);
    setWeights(weightRes.entries);
    setTargets(profileRes.targets);

    const today = new Date().toISOString().slice(0, 10);
    const todayLog = logRes.logs.find(
      (l) => new Date(l.date).toISOString().slice(0, 10) === today
    );
    if (todayLog) {
      setCalories(String(todayLog.calories));
      setProteinG(String(todayLog.proteinG));
      setWaterMl(String(todayLog.waterMl));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveLog(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    await apiSend("/api/logs", "PUT", {
      calories: Number(calories || 0),
      proteinG: Number(proteinG || 0),
      waterMl: Number(waterMl || 0)
    });
    setMsg("Journée enregistrée ✓");
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={saveLog} className="card space-y-4 lg:col-span-2">
          <h2 className="font-semibold">Nutrition du jour</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field
              label="Calories (kcal)"
              value={calories}
              onChange={setCalories}
              hint={targets ? `objectif ${targets.calorieTarget}` : undefined}
            />
            <Field
              label="Protéines (g)"
              value={proteinG}
              onChange={setProteinG}
              hint={targets ? `objectif ${targets.proteinTargetG}` : undefined}
            />
            <Field
              label="Eau (ml)"
              value={waterMl}
              onChange={setWaterMl}
              hint={targets ? `objectif ${targets.waterTargetMl}` : undefined}
            />
          </div>
          <button type="submit" className="btn-primary">Enregistrer la journée</button>
        </form>

        <form onSubmit={saveWeight} className="card space-y-4">
          <h2 className="font-semibold">Poids du jour</h2>
          <Field label="Poids (kg)" value={weightKg} onChange={setWeightKg} step="0.1" />
          <button type="submit" className="btn-primary">Ajouter</button>
        </form>
      </div>

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

function Field({
  label,
  value,
  onChange,
  hint,
  step
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={0}
        step={step ?? "1"}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </div>
  );
}
