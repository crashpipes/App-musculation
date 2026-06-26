"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/fetcher";
import { exName } from "@/lib/exercise-i18n";
import { useI18n } from "@/lib/i18n";
import type { Exercise } from "@prisma/client";

const MUSCLE_GROUPS = ["Pectoraux", "Dos", "Épaules", "Bras", "Jambes", "Abdominaux"];

const GROUP_EN: Record<string, string> = {
  Pectoraux: "Chest",
  Dos: "Back",
  "Épaules": "Shoulders",
  Bras: "Arms",
  Jambes: "Legs",
  Abdominaux: "Abs"
};

export default function ExercisesPage() {
  const { t, locale } = useI18n();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<string>("Tous");
  const [showForm, setShowForm] = useState(false);

  const groupLabel = (g: string) => (locale === "en" ? GROUP_EN[g] ?? g : g);

  async function load() {
    const res = await apiGet<{ exercises: Exercise[] }>("/api/exercises");
    setExercises(res.exercises);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "Tous" ? exercises : exercises.filter((e) => e.muscleGroup === filter)),
    [exercises, filter]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const ex of filtered) {
      const arr = map.get(ex.muscleGroup) ?? [];
      arr.push(ex);
      map.set(ex.muscleGroup, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("Exercices", "Exercises")}</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          {showForm ? t("Fermer", "Close") : t("+ Exercice personnalisé", "+ Custom exercise")}
        </button>
      </div>

      {showForm && (
        <CustomExerciseForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {["Tous", ...MUSCLE_GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={filter === g ? "btn-primary !py-1.5 text-xs" : "btn-ghost !py-1.5 text-xs"}
          >
            {g === "Tous" ? t("Tous", "All") : groupLabel(g)}
          </button>
        ))}
      </div>

      {[...grouped.entries()].map(([group, items]) => (
        <div key={group}>
          <h2 className="mb-3 text-lg font-semibold">{groupLabel(group)}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((ex) => (
              <Link key={ex.id} href={`/exercises/${ex.id}`} className="card transition hover:border-brand-500">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{exName(ex.name, locale)}</span>
                  {!ex.isPreset && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                      {t("perso", "custom")}
                    </span>
                  )}
                </div>
                {ex.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[rgb(var(--muted))]">{ex.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomExerciseForm({ onCreated }: { onCreated: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [group, setGroup] = useState(MUSCLE_GROUPS[0]!);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiSend("/api/exercises", "POST", {
        name,
        muscleGroup: group,
        description: description || undefined
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <h2 className="font-semibold">{t("Nouvel exercice", "New exercise")}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{t("Nom", "Name")}</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("Groupe musculaire", "Muscle group")}</label>
          <select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {GROUP_EN[g] ? `${g} / ${GROUP_EN[g]}` : g}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t("Description", "Description")}</label>
        <textarea className="input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? t("Création…", "Creating…") : t("Créer l'exercice", "Create exercise")}
      </button>
    </form>
  );
}
