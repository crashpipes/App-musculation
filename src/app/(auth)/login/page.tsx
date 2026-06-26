"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false
    });
    setLoading(false);
    if (res?.error) {
      setError(t("Email ou mot de passe incorrect.", "Invalid email or password."));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold">{t("Connexion", "Sign in")}</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
        {t("Accédez à votre espace personnel.", "Access your personal space.")}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">{t("Email", "Email")}</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t("Mot de passe", "Password")}</label>
          <input id="password" name="password" type="password" required className="input" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("Connexion…", "Signing in…") : t("Se connecter", "Sign in")}
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">
          {t("Mot de passe oublié ?", "Forgot password?")}
        </Link>
        <Link href="/register" className="text-brand-600 hover:underline">
          {t("Créer un compte", "Create account")}
        </Link>
      </div>
    </div>
  );
}
