"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/fetcher";
import { exName, muscleName } from "@/lib/exercise-i18n";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Exercise, Routine, RoutineExercise } from "@prisma/client";

type RoutineFull = Routine & {
  exercises: (RoutineExercise & { exercise: Exercise })[];
};

export default function RoutineDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();
  const [routine, setRoutine] = useState<RoutineFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiGet<{ routine: RoutineFull }>(`/api/routines/${params.id}`)
      .then((r) => setRoutine(r.routine))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [params.id]);

  function toggle(id: string) {
    haptic();
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function remove() {
    if (!confirm(t("Supprimer ce programme ?", "Delete this routine?"))) return;
    await apiSend(`/api/routines/${params.id}`, "DELETE");
    router.push("/routines");
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!routine) return <p className="text-[rgb(var(--muted))]">{t("Chargement…", "Loading…")}</p>;

  const completed = done.size;
  const total = routine.exercises.length;

  return (
    <div className="space-y-6">
      <Link href="/routines" className="text-sm text-brand-600 hover:underline">
        {t("← Tous les programmes", "← All routines")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{routine.name}</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            {completed} / {total} {t("terminés", "done")}
          </p>
        </div>
        <button onClick={remove} className="btn-ghost text-red-500">
          {t("Supprimer", "Delete")}
        </button>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">{t("Séance guidée", "Guided session")}</h2>
        <ul className="divide-y divide-[rgb(var(--border))]">
          {routine.exercises.map((e) => {
            const isDone = done.has(e.id);
            return (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <button
                  type="button"
                  onClick={() => toggle(e.id)}
                  aria-label={t("Marquer fait", "Mark done")}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm",
                    isDone
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-[rgb(var(--border))]"
                  )}
                >
                  {isDone ? "✓" : ""}
                </button>
                <div className={cn("flex-1", isDone && "opacity-50 line-through")}>
                  <p className="font-medium">{exName(e.exercise.name, locale)}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {muscleName(e.exercise.muscleGroup, locale)} · {e.targetSets} × {e.targetReps}
                  </p>
                </div>
                <Link
                  href={`/exercises/${e.exerciseId}`}
                  className="btn-ghost !py-1.5 text-xs"
                >
                  {t("Enregistrer", "Log")}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
