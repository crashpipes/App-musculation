"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function Landing() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("Suivez vos ", "Track your ")}
          <span className="text-brand-600">{t("gains", "gains")}</span>
        </h1>
        <p className="mx-auto max-w-xl text-[rgb(var(--muted))]">
          {t(
            "Calculez vos objectifs caloriques et protéiques, enregistrez vos séances, et visualisez votre progression jour après jour.",
            "Calculate your calorie and protein targets, log your workouts, and track your progress day after day."
          )}
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/register" className="btn-primary">
          {t("Créer un compte", "Create account")}
        </Link>
        <Link href="/login" className="btn-ghost">
          {t("Se connecter", "Sign in")}
        </Link>
      </div>
    </main>
  );
}
