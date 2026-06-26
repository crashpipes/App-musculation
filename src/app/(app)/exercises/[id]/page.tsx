"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { LineProgressChart } from "@/components/charts/LineProgressChart";
import { StatCard } from "@/components/StatCard";
import { apiGet, apiSend } from "@/lib/fetcher";
import type { Exercise, WorkoutSet } from "@prisma/client";

interface DetailResponse {
  exercise: Exercise;
  sets: WorkoutSet[];
  personalRecord: number;
}

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    try {
      const res = await apiGet<DetailResponse>(`/api/exercises/${params.id}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }
  useEffect(() => {
    load();
  }, [params.id]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    await apiSend("/api/sets", "POST", {
      exerciseId: params.id,
      sets: Number(sets || 1),
      reps: Number(reps || 0),
      weightKg: Number(weight || 0),
      notes: notes || undefined
    });
    setReps("");
    setWeight("");
    setNotes("");
    load();
  }

  async function deleteSet(id: string) {
    await apiSend(`/api/sets/${id}`, "DELETE");
    load();
  }

  async function deleteExercise() {
    if (!confirm("Supprimer cet exercice et son historique ?")) return;
    await apiSend(`/api/exercises/${params.id}`, "DELETE");
    router.push("/exercises");
  }

  const series = useMemo(
    () =>
      (data?.sets ?? []).map((s) => ({
        label: format(new Date(s.date), "dd/MM", { locale: fr }),
        value: s.weightKg
      })),
    [data]
  );

  const totalVolume = useMemo(
    () =>
      (data?.sets ?? []).reduce(
        (sum, s) => sum + s.sets * s.reps * s.weightKg,
        0
      ),
    [data]
  );

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-[rgb(var(--muted))]">Chargement…</p>;

  return (
    <div className="space-y-6">
      <Link href="/exercises" className="text-sm text-brand-600 hover:underline">
        ← Tous les exercices
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.exercise.name}</h1>
          <p className="text-[rgb(var(--muted))]">{data.exercise.muscleGroup}</p>
          {data.exercise.description && (
            <p className="mt-1 max-w-prose text-sm">{data.exercise.description}</p>
          )}
        </div>
        {!data.exercise.isPreset && (
          <button onClick={deleteExercise} className="btn-ghost text-red-500">
            Supprimer
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="🏆 Record (PR)" value={`${data.personalRecord} kg`} />
        <StatCard label="Entrées enregistrées" value={data.sets.length} />
        <StatCard label="Volume total" value={`${Math.round(totalVolume)} kg`} />
      </div>

      <form onSubmit={addEntry} className="card space-y-4">
        <h2 className="font-semibold">Enregistrer une performance</h2>
        <p className="text-sm text-[rgb(var(--muted))]">
          Saisis tes séries en une fois : nombre de séries, répétitions et charge.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField label="Nb de séries" value={sets} onChange={setSets} />
          <NumField label="Répétitions" value={reps} onChange={setReps} />
          <NumField label="Charge (kg)" value={weight} onChange={setWeight} step="0.5" />
          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary">Ajouter</button>
      </form>

      <div className="card">
        <h2 className="mb-2 font-semibold">Progression de la charge</h2>
        <LineProgressChart data={series} color="#4f46e5" unit=" kg" />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Historique</h2>
        {data.sets.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Aucune performance enregistrée.</p>
        ) : (
          <ul className="divide-y divide-[rgb(var(--border))]">
            {[...data.sets].reverse().map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span>{format(new Date(s.date), "dd/MM/yyyy", { locale: fr })}</span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">
                    {s.sets} × {s.reps} @ {s.weightKg} kg
                  </span>
                  {s.notes && (
                    <span className="text-[rgb(var(--muted))]">{s.notes}</span>
                  )}
                  <button
                    onClick={() => deleteSet(s.id)}
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
    </div>
  );
}

function NumField({
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
