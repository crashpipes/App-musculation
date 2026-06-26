"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { apiGet, apiSend } from "@/lib/fetcher";
import type { Exercise, WorkoutSession, WorkoutSet } from "@prisma/client";

export type ActiveWorkout = WorkoutSession & {
  sets: (WorkoutSet & { exercise: Exercise })[];
};

interface WorkoutCtx {
  active: ActiveWorkout | null;
  loading: boolean;
  refresh: () => Promise<void>;
  start: () => Promise<void>;
  finish: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutCtx | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<{ session: ActiveWorkout | null }>(
        "/api/workouts/active"
      );
      setActive(res.session);
    } catch {
      setActive(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const start = useCallback(async () => {
    await apiSend("/api/workouts/start", "POST");
    await refresh();
  }, [refresh]);

  const finish = useCallback(async () => {
    await apiSend("/api/workouts/finish", "POST");
    await refresh();
  }, [refresh]);

  return (
    <WorkoutContext.Provider value={{ active, loading, refresh, start, finish }}>
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
