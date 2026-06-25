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
  activity: z.enum([
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "ACTIVE",
    "VERY_ACTIVE"
  ])
});

export const dailyLogSchema = z.object({
  date: z.coerce.date().optional(),
  calories: z.coerce.number().int().min(0).max(20000),
  proteinG: z.coerce.number().int().min(0).max(1000),
  waterMl: z.coerce.number().int().min(0).max(20000)
});

export const weightEntrySchema = z.object({
  weightKg: z.coerce.number().min(25).max(400),
  date: z.coerce.date().optional()
});

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
  muscleGroup: z.string().trim().min(1, "Groupe musculaire requis").max(60),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  imageUploadId: z.string().cuid().optional().nullable()
});

export const workoutSetSchema = z.object({
  exerciseId: z.string().cuid(),
  date: z.coerce.date().optional(),
  sessionId: z.string().cuid().optional(),
  setNumber: z.coerce.number().int().min(1).max(50),
  reps: z.coerce.number().int().min(0).max(1000),
  weightKg: z.coerce.number().min(0).max(1000),
  notes: z.string().trim().max(500).optional().or(z.literal(""))
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type DailyLogInput = z.infer<typeof dailyLogSchema>;
export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
