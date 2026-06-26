"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/badges";

export default function BadgesPage() {
  const { t } = useI18n();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiGet<{ badges: Badge[] }>("/api/badges")
      .then((r) => setBadges(r.badges))
      .finally(() => setLoaded(true));
  }, []);

  const labels: Record<string, { title: string; desc: string }> = {
    first_session: { title: t("Premier pas", "First step"), desc: t("1 séance enregistrée", "1 session logged") },
    sessions_10: { title: t("Régulier", "Regular"), desc: t("10 séances", "10 sessions") },
    sessions_50: { title: t("Assidu", "Dedicated"), desc: t("50 séances", "50 sessions") },
    streak_7: { title: t("Une semaine", "One week"), desc: t("7 jours d'affilée", "7-day streak") },
    streak_30: { title: t("Un mois", "One month"), desc: t("30 jours d'affilée", "30-day streak") },
    meals_50: { title: t("Gourmand", "Foodie"), desc: t("50 repas enregistrés", "50 meals logged") },
    logged_30: { title: t("Discipliné", "Disciplined"), desc: t("30 jours de suivi", "30 days tracked") },
    strength_100: { title: t("Costaud", "Strong"), desc: t("Soulever 100 kg", "Lift 100 kg") }
  };

  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("Badges", "Badges")}</h1>
        {loaded && (
          <p className="text-sm text-[rgb(var(--muted))]">
            {earned} / {badges.length} {t("débloqués", "unlocked")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((b) => {
          const l = labels[b.id] ?? { title: b.id, desc: "" };
          return (
            <div
              key={b.id}
              className={cn(
                "card text-center",
                b.earned ? "border-brand-500" : "opacity-70"
              )}
            >
              <div className={cn("text-4xl", !b.earned && "grayscale")}>{b.emoji}</div>
              <p className="mt-2 font-semibold">{l.title}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{l.desc}</p>
              {b.earned ? (
                <p className="mt-2 text-xs font-semibold text-green-600">
                  {t("Débloqué ✓", "Unlocked ✓")}
                </p>
              ) : (
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--border))]">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.round(b.progress * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {b.current} / {b.goal}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
