import type { ActivityLevel, Goal, Sex } from "@prisma/client";

/**
 * Logique métier nutritionnelle basée sur des références reconnues :
 * - BMR : équation de Mifflin-St Jeor (1990)
 * - TDEE : BMR × facteur d'activité physique (PAL)
 * - Protéines : recommandations ISSN/ACSM pour sportifs de force (1.6–2.2 g/kg)
 * - Eau : ~35 ml par kg de poids corporel (recommandation générale d'hydratation)
 */

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sédentaire (peu/pas d'exercice)",
  LIGHT: "Léger (1-3 j/semaine)",
  MODERATE: "Modéré (3-5 j/semaine)",
  ACTIVE: "Actif (6-7 j/semaine)",
  VERY_ACTIVE: "Très actif (travail physique + sport)"
};

export const GOAL_LABELS: Record<Goal, string> = {
  BULK: "Prise de masse",
  MAINTAIN: "Maintien",
  CUT: "Sèche"
};

/** Âge en années à partir d'une date de naissance. */
export function ageFromBirthDate(birthDate: Date | string): number {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** Métabolisme de base (kcal/jour) — Mifflin-St Jeor. */
export function calculateBMR(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === "MALE" ? base + 5 : base - 161;
  return Math.round(bmr);
}

/** Dépense énergétique journalière totale (kcal/jour). */
export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activity]);
}

/** Objectif calorique selon l'objectif physique. */
export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  switch (goal) {
    case "BULK":
      return Math.round(tdee * 1.1); // surplus modéré ~+10%
    case "CUT":
      return Math.round(tdee * 0.8); // déficit modéré ~-20%
    case "MAINTAIN":
    default:
      return tdee;
  }
}

/** Objectif protéines (g/jour) selon l'objectif. */
export function calculateProteinTarget(weightKg: number, goal: Goal): number {
  const perKg = goal === "BULK" ? 2.0 : goal === "CUT" ? 2.2 : 1.6;
  return Math.round(weightKg * perKg);
}

/** Objectif d'hydratation (ml/jour). */
export function calculateWaterTarget(weightKg: number): number {
  return Math.round(weightKg * 35);
}

export interface NutritionTargets {
  age: number;
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  waterTargetMl: number;
}

/** Objectif lipides (g/jour) : ~25% des calories (9 kcal/g). */
export function calculateFatTarget(calorieTarget: number): number {
  return Math.round((calorieTarget * 0.25) / 9);
}

/** Objectif glucides (g/jour) : calories restantes après protéines et lipides (4 kcal/g). */
export function calculateCarbTarget(
  calorieTarget: number,
  proteinG: number,
  fatG: number
): number {
  const remaining = calorieTarget - proteinG * 4 - fatG * 9;
  return Math.max(0, Math.round(remaining / 4));
}

/** Calcule l'ensemble des objectifs à partir des données de profil. */
export function computeTargets(input: {
  sex: Sex;
  birthDate: Date | string;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activity: ActivityLevel;
}): NutritionTargets {
  const age = ageFromBirthDate(input.birthDate);
  const bmr = calculateBMR({
    sex: input.sex,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age
  });
  const tdee = calculateTDEE(bmr, input.activity);
  const calorieTarget = calculateCalorieTarget(tdee, input.goal);
  const proteinTargetG = calculateProteinTarget(input.weightKg, input.goal);
  const waterTargetMl = calculateWaterTarget(input.weightKg);
  const fatTargetG = calculateFatTarget(calorieTarget);
  const carbsTargetG = calculateCarbTarget(calorieTarget, proteinTargetG, fatTargetG);
  return {
    age,
    bmr,
    tdee,
    calorieTarget,
    proteinTargetG,
    carbsTargetG,
    fatTargetG,
    waterTargetMl
  };
}
