"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/fetcher";
import { exName } from "@/lib/exercise-i18n";
import { useI18n } from "@/lib/i18n";
import type { Exercise, Routine, RoutineExercise } from "@prisma/client";

type RoutineFull = Routine & {
  exercises: (RoutineExercise & { exercise: Exercise })[];
};

export default function RoutinesPage() {
  const { t, locale } = useI18n();
  const [routines, setRoutines] = useState<RoutineFull[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await apiGet<{ routines: RoutineFull[] }>("/api/routines");
    setRoutines(res.routines);
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("Programmes", "Routines")}</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          {showForm ? t("Fermer", "Close") : t("+ Nouveau programme", "+ New routine")}
        </button>
      </div>

      {showForm && (
        <CreateRoutineForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {routines.length === 0 ? (
        <p className="text-sm text-[rgb(var(--muted))]">
          {t("Aucun programme. Crée ta première séance type !", "No routines yet. Create your first one!")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routines.map((r) => (
            <Link key={r.id} href={`/routines/${r.id}`} className="card transition hover:border-brand-500">
              <h2 className="font-semibold">{r.name}</h2>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                {r.exercises.length} {t("exercices", "exercises")}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-[rgb(var(--muted))]">
                {r.exercises.map((e) => exName(e.exercise.name, locale)).join(", ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateRoutineForm({ onCreated }: { onCreated: () => void }) {
  const { t, locale } = useI18n();
  const [name, setName] = useState("");
  const [all, setAll] = useState<Exercise[]>([]);
  const [selId, setSelId] = useState("");
  const [picked, setPicked] = useState<
    { exerciseId: string; targetSets: number; targetReps: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet<{ exercises: Exercise[] }>("/api/exercises").then((r) => setAll(r.exercises));
  }, []);

  const byId = useMemo(() => new Map(all.map((e) => [e.id, e])), [all]);

  function addExercise() {
    if (!selId || picked.some((p) => p.exerciseId === selId)) return;
    setPicked((p) => [...p, { exerciseId: selId, targetSets: 3, targetReps: 10 }]);
    setSelId("");
  }

  function updatePicked(i: number, patch: Partial<(typeof picked)[number]>) {
    setPicked((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiSend("/api/routines", "POST", { name, exercises: picked });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <h2 className="font-semibold">{t("Nouveau programme", "New routine")}</h2>
      <div>
        <label className="label">{t("Nom (ex. Push, Jambes…)", "Name (e.g. Push, Legs…)")}</label>
        <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="label">{t("Ajouter un exercice", "Add an exercise")}</label>
        <div className="flex gap-2">
          <select className="input" value={selId} onChange={(e) => setSelId(e.target.value)}>
            <option value="">{t("— Choisir —", "— Choose —")}</option>
            {all.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {exName(ex.name, locale)}
              </option>
            ))}
          </select>
          <button type="button" onClick={addExercise} className="btn-ghost">
            {t("Ajouter", "Add")}
          </button>
        </div>
      </div>

      {picked.length > 0 && (
        <ul className="space-y-2">
          {picked.map((p, i) => (
            <li key={p.exerciseId} className="flex items-center gap-2 text-sm">
              <span className="flex-1 font-medium">
                {exName(byId.get(p.exerciseId)?.name ?? "", locale)}
              </span>
              <input
                type="number"
                min={1}
                className="input w-16"
                value={p.targetSets}
                onChange={(e) => updatePicked(i, { targetSets: Number(e.target.value) })}
              />
              <span className="text-[rgb(var(--muted))]">×</span>
              <input
                type="number"
                min={1}
                className="input w-16"
                value={p.targetReps}
                onChange={(e) => updatePicked(i, { targetReps: Number(e.target.value) })}
              />
              <button
                type="button"
                onClick={() => setPicked((arr) => arr.filter((_, idx) => idx !== i))}
                className="btn-ghost !px-3 text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading || picked.length === 0} className="btn-primary">
        {loading ? t("Création…", "Creating…") : t("Créer le programme", "Create routine")}
      </button>
    </form>
  );
}
