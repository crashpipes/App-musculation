// Calcul des badges/objectifs à partir des données agrégées de l'utilisateur.
// L'UI traduit l'id en titre/description.

export interface BadgeInput {
  sessionCount: number;
  bestStreak: number;
  mealCount: number;
  loggedDays: number;
  maxWeightLifted: number;
}

export interface Badge {
  id: string;
  emoji: string;
  goal: number;
  current: number;
  progress: number; // 0..1
  earned: boolean;
}

type Metric = keyof BadgeInput;

const BADGE_DEFS: { id: string; emoji: string; metric: Metric; goal: number }[] = [
  { id: "first_session", emoji: "🎯", metric: "sessionCount", goal: 1 },
  { id: "sessions_10", emoji: "💪", metric: "sessionCount", goal: 10 },
  { id: "sessions_50", emoji: "🏆", metric: "sessionCount", goal: 50 },
  { id: "streak_7", emoji: "🔥", metric: "bestStreak", goal: 7 },
  { id: "streak_30", emoji: "⚡", metric: "bestStreak", goal: 30 },
  { id: "meals_50", emoji: "🍽️", metric: "mealCount", goal: 50 },
  { id: "logged_30", emoji: "📅", metric: "loggedDays", goal: 30 },
  { id: "strength_100", emoji: "🦍", metric: "maxWeightLifted", goal: 100 }
];

export function computeBadges(input: BadgeInput): Badge[] {
  return BADGE_DEFS.map((d) => {
    const current = Number(input[d.metric] ?? 0);
    const progress = d.goal > 0 ? Math.max(0, Math.min(1, current / d.goal)) : 0;
    return {
      id: d.id,
      emoji: d.emoji,
      goal: d.goal,
      current: Math.round(current),
      progress,
      earned: current >= d.goal
    };
  });
}
