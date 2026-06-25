import type {
  ActivityLevel,
  DailyLog,
  Exercise,
  Goal,
  Profile,
  Sex,
  WeightEntry,
  WorkoutSet
} from "@prisma/client";
import type { NutritionTargets } from "@/lib/nutrition";

export type { ActivityLevel, Goal, Sex, NutritionTargets };

export interface DashboardData {
  profile: Profile | null;
  targets: NutritionTargets | null;
  todayLog: DailyLog | null;
  logs: DailyLog[];
  weights: WeightEntry[];
  recentSets: (WorkoutSet & { exercise: Exercise })[];
  streak: number;
  stats: {
    firstWeight: number | null;
    lastWeight: number | null;
    weightChange: number | null;
    daysTracked: number;
  };
}

export interface ProfileResponse {
  profile: Profile | null;
  targets: NutritionTargets | null;
}

export type SetWithExercise = WorkoutSet & { exercise: Exercise };
