"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { LineProgressChart } from "@/components/charts/LineProgressChart";
import { StatCard } from "@/components/StatCard";
import { apiGet, apiSend } from "@/lib/fetcher";
import { haptic } from "@/lib/haptics";
import { bestEstimated1RM } from "@/lib/onerm";
import { exName, muscleName } from "@/lib/exercise-i18n";
import { exerciseImage } from "@/lib/exercise-images";
import { useI18n } from "@/lib/i18n";
import type { Exercise, WorkoutSet } from "@prisma/client";

interface DetailResponse {
  exercise: Exercise;
  sets: WorkoutSet[];
  personalRecord: number;
}

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();
  const dl = locale === "en" ? enUS : fr;
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
      setError(e instanceof Error ? e.message : t("Erreur", "Error"));
    }
  }
  useEffect(() => {
    load();
  }, [params.id]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    haptic();
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
    if (!confirm(t("Supprimer cet exercice et son historique ?", "Delete this exercise and its history?"))) return;
    await apiSend(`/api/exercises/${params.id}`, "DELETE");
    router.push("/exercises");
  }

  const series = useMemo(
    () =>
      (data?.sets ?? []).map((s) => ({
        label: format(new Date(s.date), "dd/MM", { locale: dl }),
        value: s.weightKg
      })),
    [data, dl]
  );

  const totalVolume = useMemo(
    () => (data?.sets ?? []).reduce((sum, s) => sum + s.sets * s.reps * s.weightKg, 0),
    [data]
  );

  const oneRM = useMemo(() => bestEstimated1RM(data?.sets ?? []), [data]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-[rgb(var(--muted))]">{t("Chargement…", "Loading…")}</p>;

  return (
    <div className="space-y-6">
      <Link href="/exercises" className="text-sm text-brand-600 hover:underline">
        {t("← Tous les exercices", "← All exercises")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{exName(data.exercise.name, locale)}</h1>
          <p className="text-[rgb(var(--muted))]">{muscleName(data.exercise.muscleGroup, locale)}</p>
          {data.exercise.description && (
            <p className="mt-1 max-w-prose text-sm">{data.exercise.description}</p>
          )}
        </div>
        {!data.exercise.isPreset && (
          <button onClick={deleteExercise} className="btn-ghost text-red-500">
            {t("Supprimer", "Delete")}
          </button>
        )}
      </div>

      {exerciseImage(data.exercise.name) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exerciseImage(data.exercise.name)!}
          alt={exName(data.exercise.name, locale)}
          className="max-h-72 w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] object-contain"
        />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t("🏆 Record (PR)", "🏆 Record (PR)")} value={`${data.personalRecord} kg`} />
        <StatCard label={t("💥 1RM estimé", "💥 Est. 1RM")} value={`${oneRM} kg`} />
        <StatCard label={t("Entrées enregistrées", "Logged entries")} value={data.sets.length} />
        <StatCard label={t("Volume total", "Total volume")} value={`${Math.round(totalVolume)} kg`} />
      </div>

      <form onSubmit={addEntry} className="card space-y-4">
        <h2 className="font-semibold">{t("Enregistrer une performance", "Log a performance")}</h2>
        <p className="text-sm text-[rgb(var(--muted))]">
          {t(
            "Saisis tes séries en une fois : nombre de séries, répétitions et charge.",
            "Enter your sets at once: number of sets, reps and weight."
          )}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField label={t("Nb de séries", "Sets")} value={sets} onChange={setSets} />
          <NumField label={t("Répétitions", "Reps")} value={reps} onChange={setReps} />
          <NumField label={t("Charge (kg)", "Weight (kg)")} value={weight} onChange={setWeight} step="0.5" />
          <div>
            <label className="label">{t("Notes", "Notes")}</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn-primary">{t("Ajouter", "Add")}</button>
      </form>

      <div className="card">
        <h2 className="mb-2 font-semibold">{t("Progression de la charge", "Weight progression")}</h2>
        <LineProgressChart data={series} color="#4f46e5" unit=" kg" />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">{t("Historique", "History")}</h2>
        {data.sets.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">{t("Aucune performance enregistrée.", "No performance logged yet.")}</p>
        ) : (
          <ul className="divide-y divide-[rgb(var(--border))]">
            {[...data.sets].reverse().map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span>{format(new Date(s.date), "dd/MM/yyyy", { locale: dl })}</span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">{s.sets} × {s.reps} @ {s.weightKg} kg</span>
                  {s.notes && <span className="text-[rgb(var(--muted))]">{s.notes}</span>}
                  <button onClick={() => deleteSet(s.id)} className="text-red-500 hover:underline">✕</button>
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
      <input type="number" min={0} step={step ?? "1"} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
