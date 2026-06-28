"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { apiGet, apiSend } from "@/lib/fetcher";
import type {
  Exercise,
  SessionExercise,
  WorkoutSession,
  WorkoutSet
} from "@prisma/client";

export type ActiveWorkout = WorkoutSession & {
  sets: (WorkoutSet & { exercise: Exercise })[];
  exercises: (SessionExercise & { exercise: Exercise })[];
};

interface AddSetPayload {
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number;
  notes?: string;
}

interface WorkoutCtx {
  active: ActiveWorkout | null;
  loading: boolean;
  refresh: () => Promise<void>;
  start: (routineId?: string) => Promise<void>;
  finish: () => Promise<void>;
  addSet: (payload: AddSetPayload, exercise: Exercise) => Promise<void>;
  addExercise: (exercise: Exercise) => Promise<void>;
  removeExercise: (sessionExerciseId: string) => Promise<void>;
}

const STORAGE = "muscu.active";

function loadCached(): ActiveWorkout | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE);
    if (!s) return null;
    const a = JSON.parse(s) as ActiveWorkout;
    // Compatibilité : anciennes séances en cache sans listes.
    return { ...a, sets: a.sets ?? [], exercises: a.exercises ?? [] };
  } catch {
    return null;
  }
}

const WorkoutContext = createContext<WorkoutCtx | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [active, setActiveState] = useState<ActiveWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  // Charge l'état mis en cache (utile hors-ligne) au montage.
  useEffect(() => {
    setActiveState(loadCached());
  }, []);

  const setActive = useCallback((a: ActiveWorkout | null) => {
    setActiveState(a);
    if (typeof window !== "undefined") {
      if (a) localStorage.setItem(STORAGE, JSON.stringify(a));
      else localStorage.removeItem(STORAGE);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<{ session: ActiveWorkout | null }>(
        "/api/workouts/active"
      );
      setActive(res.session);
    } catch {
      // hors-ligne ou erreur : on garde l'état local en cache
    } finally {
      setLoading(false);
    }
  }, [setActive]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const start = useCallback(
    async (routineId?: string) => {
      const res = (await apiSend(
        "/api/workouts/start",
        "POST",
        routineId ? { routineId } : undefined
      )) as { queued?: boolean; session?: ActiveWorkout };
      if (res?.queued) {
        // Hors-ligne : séance locale temporaire (synchronisée au retour réseau).
        const now = new Date().toISOString() as unknown as Date;
        setActive({
          id: "local",
          userId: "",
          date: now,
          endedAt: null,
          notes: null,
          routineId: routineId ?? null,
          createdAt: now,
          sets: [],
          exercises: []
        });
      } else if (res?.session) {
        setActive(res.session);
      } else {
        await refresh();
      }
    },
    [refresh, setActive]
  );

  const addExercise = useCallback(
    async (exercise: Exercise) => {
      // Ajout optimiste de l'exercice dans la liste de la séance.
      if (active && !active.exercises.some((e) => e.exerciseId === exercise.id)) {
        const optimistic = {
          id: `local-ex-${Date.now()}`,
          sessionId: active.id,
          exerciseId: exercise.id,
          order: active.exercises.length,
          targetSets: null,
          targetReps: null,
          createdAt: new Date().toISOString() as unknown as Date,
          exercise
        };
        setActive({ ...active, exercises: [...active.exercises, optimistic] });
      }
      const res = (await apiSend("/api/workouts/exercises", "POST", {
        exerciseId: exercise.id
      })) as { queued?: boolean };
      if (!res?.queued) await refresh();
    },
    [active, refresh, setActive]
  );

  const removeExercise = useCallback(
    async (sessionExerciseId: string) => {
      if (active) {
        const target = active.exercises.find((e) => e.id === sessionExerciseId);
        setActive({
          ...active,
          exercises: active.exercises.filter((e) => e.id !== sessionExerciseId),
          // Retire aussi les séries déjà saisies pour cet exercice.
          sets: target
            ? active.sets.filter((s) => s.exerciseId !== target.exerciseId)
            : active.sets
        });
      }
      const res = (await apiSend(
        `/api/workouts/exercises/${sessionExerciseId}`,
        "DELETE"
      )) as { queued?: boolean };
      if (!res?.queued) await refresh();
    },
    [active, refresh, setActive]
  );

  const finish = useCallback(async () => {
    setActive(null);
    await apiSend("/api/workouts/finish", "POST");
  }, [setActive]);

  const addSet = useCallback(
    async (payload: AddSetPayload, exercise: Exercise) => {
      // Ajout optimiste (affiché immédiatement, même hors-ligne).
      const optimistic = {
        id: `local-${Date.now()}`,
        sessionId: active?.id ?? "local",
        exerciseId: payload.exerciseId,
        sets: payload.sets,
        reps: payload.reps,
        weightKg: payload.weightKg,
        notes: payload.notes ?? null,
        date: new Date().toISOString() as unknown as Date,
        exercise
      };
      if (active) setActive({ ...active, sets: [...active.sets, optimistic] });

      const res = (await apiSend("/api/sets", "POST", payload)) as { queued?: boolean };
      if (!res?.queued) {
        await refresh();
      }
    },
    [active, refresh, setActive]
  );

  return (
    <WorkoutContext.Provider
      value={{ active, loading, refresh, start, finish, addSet, addExercise, removeExercise }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout(): WorkoutCtx {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout doit être utilisé dans WorkoutProvider");
  return ctx;
}

export function formatElapsed(seconds: number): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
