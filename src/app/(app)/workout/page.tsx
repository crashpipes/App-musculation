"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/fetcher";
import { exName } from "@/lib/exercise-i18n";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { formatElapsed, useWorkout, type ActiveWorkout } from "@/lib/workout";
import type { Exercise, Routine, RoutineExercise } from "@prisma/client";

type RoutineFull = Routine & {
  exercises: (RoutineExercise & { exercise: Exercise })[];
};

export default function WorkoutPage() {
  const { t, locale } = useI18n();
  const { active, loading, start, finish, addExercise } = useWorkout();
  const [all, setAll] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<RoutineFull[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    apiGet<{ exercises: Exercise[] }>("/api/exercises").then((r) => setAll(r.exercises));
    apiGet<{ routines: RoutineFull[] }>("/api/routines")
      .then((r) => setRoutines(r.routines))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    const st = new Date(active.date).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - st) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  async function begin(routineId?: string) {
    setStarting(true);
    haptic();
    try {
      await start(routineId);
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return <p className="text-[rgb(var(--muted))]">{t("Chargement…", "Loading…")}</p>;
  }

  // ----- Écran de démarrage : choix d'un programme ou séance à vide -----
  if (!active) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-center text-2xl font-bold">{t("Séance", "Workout")}</h1>

        <div className="card space-y-4 text-center">
          <div className="text-5xl">🏋️</div>
          <p className="text-sm text-[rgb(var(--muted))]">
            {t(
              "Choisis un programme pour charger ses exercices, ou démarre à vide.",
              "Pick a routine to load its exercises, or start from scratch."
            )}
          </p>
          <button
            onClick={() => begin()}
            disabled={starting}
            className="btn-primary w-full"
          >
            {t("Séance à vide", "Empty workout")}
          </button>
        </div>

        {routines.length > 0 && (
          <div className="card space-y-3">
            <h2 className="font-semibold">{t("Démarrer un programme", "Start a routine")}</h2>
            <div className="space-y-2">
              {routines.map((r) => (
                <button
                  key={r.id}
                  onClick={() => begin(r.id)}
                  disabled={starting}
                  className="w-full rounded-xl border border-[rgb(var(--border))] p-3 text-left transition hover:border-brand-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-[rgb(var(--muted))]">
                      {r.exercises.length} {t("exercices", "exercises")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-[rgb(var(--muted))]">
                    {r.exercises.map((e) => exName(e.exercise.name, locale)).join(", ")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[rgb(var(--muted))]">
          <Link href="/routines" className="text-brand-600 hover:underline">
            {t("Gérer mes programmes", "Manage routines")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <ActiveWorkoutView
      active={active}
      all={all}
      elapsed={elapsed}
      onFinish={finish}
      onAddExercise={addExercise}
    />
  );
}

function ActiveWorkoutView({
  active,
  all,
  elapsed,
  onFinish,
  onAddExercise
}: {
  active: ActiveWorkout;
  all: Exercise[];
  elapsed: number;
  onFinish: () => void;
  onAddExercise: (ex: Exercise) => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [pickId, setPickId] = useState("");

  const exercises = active.exercises ?? [];
  const totalVolume = Math.round(
    active.sets.reduce((sum, s) => sum + s.sets * s.reps * s.weightKg, 0)
  );

  // Exercices encore disponibles à l'ajout (pas déjà dans la séance).
  const available = useMemo(() => {
    const inSession = new Set(exercises.map((e) => e.exerciseId));
    return all.filter((ex) => !inSession.has(ex.id));
  }, [all, exercises]);

  async function onAdd() {
    const ex = all.find((x) => x.id === pickId);
    if (!ex) return;
    haptic();
    setPickId("");
    await onAddExercise(ex);
  }

  return (
    <div className="space-y-5">
      <div className="card text-center">
        <p className="text-sm text-[rgb(var(--muted))]">
          {t("Séance en cours", "Workout in progress")}
        </p>
        <p className="my-1 font-mono text-5xl font-bold tabular-nums">{formatElapsed(elapsed)}</p>
        <p className="text-sm text-[rgb(var(--muted))]">
          {active.sets.length} {t("séries", "sets")} · {totalVolume} kg {t("de volume", "volume")}
        </p>
        <button onClick={() => { haptic(); onFinish(); }} className="btn-primary mt-3 w-full">
          {t("Terminer la séance", "Finish workout")}
        </button>
      </div>

      {exercises.length === 0 ? (
        <p className="card text-center text-sm text-[rgb(var(--muted))]">
          {t(
            "Aucun exercice. Ajoute-en un ci-dessous pour commencer.",
            "No exercises yet. Add one below to get started."
          )}
        </p>
      ) : (
        exercises.map((se) => (
          <ExerciseCard
            key={se.id}
            sessionExerciseId={se.id}
            exercise={se.exercise}
            targetSets={se.targetSets}
            targetReps={se.targetReps}
            sets={active.sets.filter((s) => s.exerciseId === se.exerciseId)}
          />
        ))
      )}

      <div className="card space-y-3">
        <h2 className="font-semibold">{t("Ajouter un exercice", "Add an exercise")}</h2>
        <div className="flex gap-2">
          <select
            className="input"
            value={pickId}
            onChange={(e) => setPickId(e.target.value)}
          >
            <option value="">{t("— Choisir —", "— Choose —")}</option>
            {available.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {exName(ex.name, locale)}
              </option>
            ))}
          </select>
          <button type="button" onClick={onAdd} disabled={!pickId} className="btn-primary">
            {t("Ajouter", "Add")}
          </button>
        </div>
        <p className="text-center text-xs text-[rgb(var(--muted))]">
          <Link href="/exercises" className="text-brand-600 hover:underline">
            {t("Voir la bibliothèque d'exercices", "Browse exercise library")}
          </Link>
        </p>
      </div>
    </div>
  );
}

function ExerciseCard({
  sessionExerciseId,
  exercise,
  targetSets,
  targetReps,
  sets
}: {
  sessionExerciseId: string;
  exercise: Exercise;
  targetSets: number | null;
  targetReps: number | null;
  sets: ActiveWorkout["sets"];
}) {
  const { t, locale } = useI18n();
  const { addSet, removeExercise } = useWorkout();
  const [setsCount, setSetsCount] = useState("1");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onLog(e: React.FormEvent) {
    e.preventDefault();
    if (!reps || !weight) return;
    setError(null);
    setBusy(true);
    haptic();
    try {
      await addSet(
        {
          exerciseId: exercise.id,
          sets: Number(setsCount || 1),
          reps: Number(reps || 0),
          weightKg: Number(weight || 0)
        },
        exercise
      );
      setReps("");
      setWeight("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    const msg =
      sets.length > 0
        ? t(
            "Retirer cet exercice et ses séries de la séance ?",
            "Remove this exercise and its sets from the workout?"
          )
        : t("Retirer cet exercice de la séance ?", "Remove this exercise from the workout?");
    if (!confirm(msg)) return;
    haptic();
    await removeExercise(sessionExerciseId);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{exName(exercise.name, locale)}</h3>
          {targetSets && targetReps ? (
            <p className="text-xs text-[rgb(var(--muted))]">
              {t("Objectif", "Target")}: {targetSets} × {targetReps}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="btn-ghost !px-3 text-red-500"
          aria-label={t("Retirer", "Remove")}
        >
          ✕
        </button>
      </div>

      {sets.length > 0 && (
        <ul className="divide-y divide-[rgb(var(--border))] text-sm">
          {sets.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between py-1.5">
              <span className="text-[rgb(var(--muted))]">
                {t("Série", "Set")} {i + 1}
              </span>
              <span className="font-medium">
                {s.sets} × {s.reps} @ {s.weightKg} kg
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onLog} className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Num label={t("Séries", "Sets")} value={setsCount} onChange={setSetsCount} />
          <Num label={t("Reps", "Reps")} value={reps} onChange={setReps} />
          <Num label={t("Charge (kg)", "Weight (kg)")} value={weight} onChange={setWeight} step="0.5" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={busy || !reps || !weight} className="btn-primary w-full">
          {t("Enregistrer la série", "Log set")}
        </button>
      </form>
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
      <input
        type="number"
        min={0}
        step={step ?? "1"}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
