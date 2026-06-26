"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { apiSend } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      await apiSend("/api/register", "POST", {
        name: String(form.get("name")) || undefined,
        email,
        password
      });
      await signIn("credentials", { email, password, redirect: false });
      router.push("/profile?welcome=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold">{t("Créer un compte", "Create account")}</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
        {t("Commencez à suivre votre progression.", "Start tracking your progress.")}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">{t("Prénom (optionnel)", "First name (optional)")}</label>
          <input id="name" name="name" type="text" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">{t("Email", "Email")}</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t("Mot de passe", "Password")}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="input"
          />
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {t("Au moins 8 caractères.", "At least 8 characters.")}
          </p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("Création…", "Creating…") : t("Créer mon compte", "Create my account")}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        {t("Déjà inscrit ?", "Already registered?")}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          {t("Se connecter", "Sign in")}
        </Link>
      </p>
    </div>
  );
}
