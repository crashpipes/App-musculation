import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80).optional(),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z
    .string()
    .min(8, "Au moins 8 caractères")
    .max(100, "Mot de passe trop long")
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Au moins 8 caractères").max(100)
});

export const profileSchema = z.object({
  sex: z.enum(["MALE", "FEMALE"]),
  birthDate: z.coerce.date().refine((d) => d < new Date(), "Date invalide"),
  heightCm: z.coerce.number().min(80).max(260),
  currentWeight: z.coerce.number().min(25).max(400),
  goal: z.enum(["BULK", "MAINTAIN", "CUT"]),
  activity: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"])
});

// Un repas qui s'ajoute au total de la journée. `day` = jour local (YYYY-MM-DD).
export const mealSchema = z.object({
  day: z.coerce.date().optional(),
  label: z.string().trim().max(60).optional().or(z.literal("")),
  calories: z.coerce.number().int().min(0).max(20000),
  proteinG: z.coerce.number().int().min(0).max(1000),
  carbsG: z.coerce.number().int().min(0).max(2000).optional(),
  fatG: z.coerce.number().int().min(0).max(2000).optional()
});

export const routineSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(60),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().cuid(),
        targetSets: z.coerce.number().int().min(1).max(20),
        targetReps: z.coerce.number().int().min(1).max(100)
      })
    )
    .min(1, "Au moins un exercice")
    .max(30)
});

// Ajout d'eau qui s'additionne sur la journée.
export const waterSchema = z.object({
  day: z.coerce.date().optional(),
  amountMl: z.coerce.number().int().min(1).max(10000)
});

export const weightEntrySchema = z.object({
  weightKg: z.coerce.number().min(25).max(400),
  date: z.coerce.date().optional()
});

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
  muscleGroup: z.string().trim().min(1, "Groupe musculaire requis").max(60),
  description: z.string().trim().max(1000).optional().or(z.literal(""))
});

// Saisie rapide : `sets` séries de `reps` répétitions à `weightKg`.
export const workoutSetSchema = z.object({
  exerciseId: z.string().cuid(),
  date: z.coerce.date().optional(),
  sessionId: z.string().cuid().optional(),
  sets: z.coerce.number().int().min(1).max(50),
  reps: z.coerce.number().int().min(0).max(1000),
  weightKg: z.coerce.number().min(0).max(1000),
  notes: z.string().trim().max(500).optional().or(z.literal(""))
});

export const aiSettingsSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]),
  apiKey: z.string().trim().min(10, "Clé trop courte").max(300),
  model: z.string().trim().max(100).optional().or(z.literal(""))
});

export const aiEstimateSchema = z
  .object({
    mode: z.enum(["photo", "foods"]),
    imageBase64: z.string().max(12_000_000).optional(),
    mimeType: z.string().max(60).optional(),
    foods: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(80),
          grams: z.coerce.number().min(1).max(5000)
        })
      )
      .max(30)
      .optional()
  })
  .refine(
    (d) =>
      (d.mode === "photo" && !!d.imageBase64) ||
      (d.mode === "foods" && !!d.foods && d.foods.length > 0),
    "Données insuffisantes pour l'estimation"
  );

export type AiSettingsInput = z.infer<typeof aiSettingsSchema>;
export type AiEstimateInput = z.infer<typeof aiEstimateSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type MealInput = z.infer<typeof mealSchema>;
export type RoutineInput = z.infer<typeof routineSchema>;
export type WaterInput = z.infer<typeof waterSchema>;
export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
