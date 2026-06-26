import type { Locale } from "@/lib/i18n";

export const MUSCLE_GROUP_EN: Record<string, string> = {
  Pectoraux: "Chest",
  Dos: "Back",
  "Épaules": "Shoulders",
  Bras: "Arms",
  Jambes: "Legs",
  Abdominaux: "Abs"
};

// Traduction des exercices préchargés (les exercices personnalisés gardent leur nom).
export const EXERCISE_EN: Record<string, string> = {
  "Développé couché": "Bench press",
  "Développé incliné": "Incline bench press",
  "Écarté haltères": "Dumbbell fly",
  Dips: "Dips",
  Tractions: "Pull-ups",
  "Tirage vertical": "Lat pulldown",
  "Rowing barre": "Barbell row",
  "Rowing haltère": "Dumbbell row",
  "Développé militaire": "Overhead press",
  "Élévations latérales": "Lateral raises",
  Oiseau: "Reverse fly",
  "Curl barre": "Barbell curl",
  "Curl haltères": "Dumbbell curl",
  "Curl marteau": "Hammer curl",
  "Barre au front": "Skull crusher",
  "Extension poulie": "Triceps pushdown",
  Squat: "Squat",
  "Presse à cuisses": "Leg press",
  Fentes: "Lunges",
  "Soulevé de terre jambes tendues": "Romanian deadlift",
  "Leg curl": "Leg curl",
  "Leg extension": "Leg extension",
  "Mollets debout": "Standing calf raise",
  Crunch: "Crunch",
  "Relevés de jambes": "Leg raises",
  Planche: "Plank"
};

export function exName(name: string, locale: Locale): string {
  return locale === "en" ? EXERCISE_EN[name] ?? name : name;
}

export function muscleName(group: string, locale: Locale): string {
  return locale === "en" ? MUSCLE_GROUP_EN[group] ?? group : group;
}
