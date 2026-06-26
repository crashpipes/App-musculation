"use client";

import { useEffect, useMemo, useState } from "react";
import { computeTargets } from "@/lib/nutrition";
import { apiGet, apiSend } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goalLabels: Record<Goal, string> = {
    BULK: t("Prise de masse", "Bulking"),
    MAINTAIN: t("Maintien", "Maintenance"),
    CUT: t("Sèche", "Cutting")
  };
  const activityLabels: Record<ActivityLevel, string> = {
    SEDENTARY: t("Sédentaire (peu/pas d'exercice)", "Sedentary (little/no exercise)"),
    LIGHT: t("Léger (1-3 j/semaine)", "Light (1-3 days/week)"),
    MODERATE: t("Modéré (3-5 j/semaine)", "Moderate (3-5 days/week)"),
    ACTIVE: t("Actif (6-7 j/semaine)", "Active (6-7 days/week)"),
    VERY_ACTIVE: t("Très actif (travail physique + sport)", "Very active (physical job + sport)")
  };

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
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="card space-y-4">
        <h1 className="text-2xl font-bold">{t("Mon profil", "My profile")}</h1>

        <div>
          <label className="label">{t("Sexe", "Sex")}</label>
          <div className="flex gap-2">
            {(["MALE", "FEMALE"] as Sex[]).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => update("sex", s)}
                className={form.sex === s ? "btn-primary flex-1" : "btn-ghost flex-1"}
              >
                {s === "MALE" ? t("Homme", "Male") : t("Femme", "Female")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="birthDate">{t("Date de naissance", "Date of birth")}</label>
            <input id="birthDate" type="date" required className="input" value={form.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="height">{t("Taille (cm)", "Height (cm)")}</label>
            <input id="height" type="number" required min={80} max={260} className="input" value={form.heightCm} onChange={(e) => update("heightCm", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="weight">{t("Poids actuel (kg)", "Current weight (kg)")}</label>
          <input id="weight" type="number" step="0.1" required min={25} max={400} className="input" value={form.currentWeight} onChange={(e) => update("currentWeight", e.target.value)} />
        </div>

        <div>
          <label className="label">{t("Objectif", "Goal")}</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(goalLabels) as Goal[]).map((g) => (
              <button type="button" key={g} onClick={() => update("goal", g)} className={form.goal === g ? "btn-primary text-xs" : "btn-ghost text-xs"}>
                {goalLabels[g]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="activity">{t("Niveau d'activité", "Activity level")}</label>
          <select id="activity" className="input" value={form.activity} onChange={(e) => update("activity", e.target.value as ActivityLevel)}>
            {(Object.keys(activityLabels) as ActivityLevel[]).map((a) => (
              <option key={a} value={a}>{activityLabels[a]}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {saved && <p className="text-sm text-green-600">{t("Profil enregistré ✓", "Profile saved ✓")}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
        </button>
      </form>

      <div className="card">
        <h2 className="text-xl font-bold">{t("Vos objectifs recommandés", "Your recommended targets")}</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          {t(
            "Calculés via Mifflin-St Jeor (BMR), facteur d'activité (TDEE) et recommandations sportives.",
            "Computed with Mifflin-St Jeor (BMR), activity factor (TDEE) and sports nutrition guidelines."
          )}
        </p>

        {preview ? (
          <dl className="mt-5 space-y-3">
            <Row label={t("Âge", "Age")} value={t(`${preview.age} ans`, `${preview.age} yrs`)} />
            <Row label={t("Métabolisme de base (BMR)", "Basal metabolic rate (BMR)")} value={t(`${preview.bmr} kcal/j`, `${preview.bmr} kcal/d`)} />
            <Row label={t("Dépense journalière (TDEE)", "Daily expenditure (TDEE)")} value={t(`${preview.tdee} kcal/j`, `${preview.tdee} kcal/d`)} />
            <hr className="border-[rgb(var(--border))]" />
            <Row label={t("🎯 Calories / jour", "🎯 Calories / day")} value={`${preview.calorieTarget} kcal`} big />
            <Row label={t("🥩 Protéines / jour", "🥩 Protein / day")} value={`${preview.proteinTargetG} g`} big />
            <Row label={t("🍚 Glucides / jour", "🍚 Carbs / day")} value={`${preview.carbsTargetG} g`} big />
            <Row label={t("🥑 Lipides / jour", "🥑 Fat / day")} value={`${preview.fatTargetG} g`} big />
            <Row label={t("💧 Eau / jour", "💧 Water / day")} value={`${(preview.waterTargetMl / 1000).toFixed(1)} L`} big />
          </dl>
        ) : (
          <p className="mt-6 text-sm text-[rgb(var(--muted))]">
            {t("Remplissez le formulaire pour voir vos objectifs.", "Fill in the form to see your targets.")}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-[rgb(var(--muted))]">{label}</dt>
      <dd className={big ? "text-lg font-bold" : "font-medium"}>{value}</dd>
    </div>
  );
}
