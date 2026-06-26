"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { formatElapsed, useWorkout } from "@/lib/workout";

export function ActiveWorkoutBar() {
  const { active, finish } = useWorkout();
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = new Date(active.date).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-brand-600 px-4 py-2 text-white">
      <Link href="/workout" className="flex items-center gap-2 text-sm font-semibold">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
        ⏱ {formatElapsed(elapsed)} · {active.sets.length} {t("séries", "sets")}
      </Link>
      <button
        onClick={() => {
          haptic();
          finish();
        }}
        className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold transition active:scale-95 hover:bg-white/30"
      >
        {t("Terminer", "Finish")}
      </button>
    </div>
  );
}
