"use client";

import { useEffect, useMemo, useState } from "react";
import { ACTIVITY_LABELS, GOAL_LABELS, computeTargets } from "@/lib/nutrition";
import { apiGet, apiSend } from "@/lib/fetcher";
import type { ActivityLevel, Goal, ProfileResponse, Sex } from "@/types";

interface FormState {
  sex: Sex;
  birthDate: string;
  heightCm: string;
  currentWeight: string;
  goal: Goal;
  activity: ActivityLevel;
}

const EMPTY: FormState = {
  sex: "MALE",
  birthDate: "",
  heightCm: "",
  currentWeight: "",
  goal: "MAINTAIN",
  activity: "MODERATE"
};

export default function ProfilePage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet<ProfileResponse>("/api/profile").then((res) => {
      if (res.profile) {
        setForm({
          sex: res.profile.sex,
          birthDate: new Date(res.profile.birthDate).toISOString().slice(0, 10),
          heightCm: String(res.profile.heightCm),
          currentWeight: String(res.profile.currentWeight),
          goal: res.profile.goal,
          activity: res.profile.activity
        });
      }
    });
  }, []);

  // Aperçu des objectifs en temps réel
  const preview = useMemo(() => {
    const h = Number(form.heightCm);
    const w = Number(form.currentWeight);
    if (!form.birthDate || h < 80 || w < 25) return null;
    return computeTargets({
      sex: form.sex,
      birthDate: form.birthDate,
      heightCm: h,
      weightKg: w,
      goal: form.goal,
      activity: form.activity
    });
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiSend("/api/profile", "PUT", {
        sex: form.sex,
        birthDate: form.birthDate,
        heightCm: Number(form.heightCm),
        currentWeight: Number(form.currentWeight),
        goal: form.goal,
        activity: form.activity
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="card space-y-4">
        <h1 className="text-2xl font-bold">Mon profil</h1>

        <div>
          <label className="label">Sexe</label>
          <div className="flex gap-2">
            {(["MALE", "FEMALE"] as Sex[]).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => update("sex", s)}
                className={
                  form.sex === s ? "btn-primary flex-1" : "btn-ghost flex-1"
                }
              >
                {s === "MALE" ? "Homme" : "Femme"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="birthDate">Date de naissance</label>
            <input
              id="birthDate"
              type="date"
              required
              className="input"
              value={form.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="height">Taille (cm)</label>
            <input
              id="height"
              type="number"
              required
              min={80}
              max={260}
              className="input"
              value={form.heightCm}
              onChange={(e) => update("heightCm", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="weight">Poids actuel (kg)</label>
          <input
            id="weight"
            type="number"
            step="0.1"
            required
            min={25}
            max={400}
            className="input"
            value={form.currentWeight}
            onChange={(e) => update("currentWeight", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Objectif</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => update("goal", g)}
                className={
                  form.goal === g ? "btn-primary text-xs" : "btn-ghost text-xs"
                }
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="activity">Niveau d&apos;activité</label>
          <select
            id="activity"
            className="input"
            value={form.activity}
            onChange={(e) => update("activity", e.target.value as ActivityLevel)}
          >
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
              <option key={a} value={a}>
                {ACTIVITY_LABELS[a]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {saved && <p className="text-sm text-green-600">Profil enregistré ✓</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <div className="card">
        <h2 className="text-xl font-bold">Vos objectifs recommandés</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Calculés via Mifflin-St Jeor (BMR), facteur d&apos;activité (TDEE) et
          recommandations sportives.
        </p>

        {preview ? (
          <dl className="mt-5 space-y-3">
            <Row label="Âge" value={`${preview.age} ans`} />
            <Row label="Métabolisme de base (BMR)" value={`${preview.bmr} kcal/j`} />
            <Row label="Dépense journalière (TDEE)" value={`${preview.tdee} kcal/j`} />
            <hr className="border-[rgb(var(--border))]" />
            <Row
              label="🎯 Calories / jour"
              value={`${preview.calorieTarget} kcal`}
              big
            />
            <Row
              label="🥩 Protéines / jour"
              value={`${preview.proteinTargetG} g`}
              big
            />
            <Row
              label="💧 Eau / jour"
              value={`${(preview.waterTargetMl / 1000).toFixed(1)} L`}
              big
            />
          </dl>
        ) : (
          <p className="mt-6 text-sm text-[rgb(var(--muted))]">
            Remplissez le formulaire pour voir vos objectifs.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  big
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-[rgb(var(--muted))]">{label}</dt>
      <dd className={big ? "text-lg font-bold" : "font-medium"}>{value}</dd>
    </div>
  );
}
