"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiSend } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiSend("/api/password/reset", "POST", {
        token,
        password: String(form.get("password"))
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="text-sm text-red-500">{t("Lien invalide.", "Invalid link.")}</p>;
  }
  if (done) {
    return (
      <p className="text-sm text-green-600">
        {t("Mot de passe mis à jour. Redirection…", "Password updated. Redirecting…")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="password">
          {t("Nouveau mot de passe", "New password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="input"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? t("Mise à jour…", "Updating…") : t("Réinitialiser", "Reset")}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
  return (
    <div className="card">
      <h1 className="text-2xl font-bold">{t("Nouveau mot de passe", "New password")}</h1>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-brand-600 hover:underline">
          {t("Retour à la connexion", "Back to sign in")}
        </Link>
      </p>
    </div>
  );
}
