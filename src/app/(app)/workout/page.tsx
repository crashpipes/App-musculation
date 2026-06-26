"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/fetcher";
import { exName } from "@/lib/exercise-i18n";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { formatElapsed, useWorkout } from "@/lib/workout";
import type { Exercise } from "@prisma/client";

export default function WorkoutPage() {
  const { t, locale } = useI18n();
  const { active, loading, start, finish, refresh } = useWorkout();
  const [all, setAll] = useState<Exercise[]>([]);
  const [selId, setSelId] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ exercises: Exercise[] }>("/api/exercises").then((r) => setAll(r.exercises));
  }, []);

  useEffect(() => {
    if (!active) return;
    const st = new Date(active.date).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - st) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  async function addSet(e: React.FormEvent) {
    e.preventDefault();
    if (!selId || !reps || !weight) return;
    setError(null);
    haptic();
    try {
      await apiSend("/api/sets", "POST", {
        exerciseId: selId,
        sets: Number(sets || 1),
        reps: Number(reps || 0),
        weightKg: Number(weight || 0)
      });
      setReps("");
      setWeight("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    }
  }

  if (loading) {
    return <p className="text-[rgb(var(--muted))]">{t("Chargement…", "Loading…")}</p>;
  }

  if (!active) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("Séance", "Workout")}</h1>
        <div className="card space-y-4">
          <div className="text-5xl">🏋️</div>
          <p className="text-sm text-[rgb(var(--muted))]">
            {t(
              "Démarre une séance, ajoute tes exercices au fur et à mesure, puis appuie sur Terminer.",
              "Start a workout, add your exercises one by one, then tap Finish."
            )}
          </p>
          <button onClick={() => { haptic(); start(); }} className="btn-primary w-full">
            {t("Commencer une séance", "Start a workout")}
          </button>
        </div>
      </div>
    );
  }

  const totalVolume = Math.round(
    active.sets.reduce((sum, s) => sum + s.sets * s.reps * s.weightKg, 0)
  );

  return (
    <div className="space-y-6">
      {/* Minuteur */}
      <div className="card text-center">
        <p className="text-sm text-[rgb(var(--muted))]">{t("Séance en cours", "Workout in progress")}</p>
        <p className="my-1 font-mono text-5xl font-bold tabular-nums">{formatElapsed(elapsed)}</p>
        <p className="text-sm text-[rgb(var(--muted))]">
          {active.sets.length} {t("séries", "sets")} · {totalVolume} kg {t("de volume", "volume")}
        </p>
        <button
          onClick={() => { haptic(); finish(); }}
          className="btn-primary mt-3 w-full"
        >
          {t("Terminer la séance", "Finish workout")}
        </button>
      </div>

      {/* Ajouter un exercice */}
      <form onSubmit={addSet} className="card space-y-4">
        <h2 className="font-semibold">{t("Ajouter un exercice", "Add an exercise")}</h2>
        <div>
          <label className="label">{t("Exercice", "Exercise")}</label>
          <select className="input" value={selId} onChange={(e) => setSelId(e.target.value)}>
            <option value="">{t("— Choisir —", "— Choose —")}</option>
            {all.map((ex) => (
              <option key={ex.id} value={ex.id}>{exName(ex.name, locale)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Num label={t("Séries", "Sets")} value={sets} onChange={setSets} />
          <Num label={t("Reps", "Reps")} value={reps} onChange={setReps} />
          <Num label={t("Charge (kg)", "Weight (kg)")} value={weight} onChange={setWeight} step="0.5" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={!selId} className="btn-primary">
          {t("Ajouter", "Add")}
        </button>
        <p className="text-center text-xs text-[rgb(var(--muted))]">
          <Link href="/exercises" className="text-brand-600 hover:underline">
            {t("Voir la bibliothèque d'exercices", "Browse exercise library")}
          </Link>
        </p>
      </form>

      {/* Exercices de la séance */}
      <div className="card">
        <h2 className="mb-3 font-semibold">{t("Cette séance", "This workout")}</h2>
        {active.sets.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            {t("Aucun exercice pour l'instant.", "No exercises yet.")}
          </p>
        ) : (
          <ul className="divide-y divide-[rgb(var(--border))]">
            {active.sets.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{exName(s.exercise.name, locale)}</span>
                <span className="text-[rgb(var(--muted))]">
                  {s.sets} × {s.reps} @ {s.weightKg} kg
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  step
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" min={0} step={step ?? "1"} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
