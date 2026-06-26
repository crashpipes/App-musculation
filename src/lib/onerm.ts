// Estimation du 1RM (charge maximale sur 1 répétition) — formule d'Epley (1985).
// 1RM = poids × (1 + reps/30). Pour 1 rép, renvoie le poids tel quel.
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

interface SetLike {
  weightKg: number;
  reps: number;
}

/** Meilleur 1RM estimé sur une liste de séries. */
export function bestEstimated1RM(sets: SetLike[]): number {
  let best = 0;
  for (const s of sets) {
    const e = epley1RM(s.weightKg, s.reps);
    if (e > best) best = e;
  }
  return Math.round(best);
}
