"use client";

import Link from "next/link";
import { useState } from "react";
import { apiSend } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t, locale } = useI18n();
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await apiSend<{ ok: boolean; devToken?: string }>(
      "/api/password/forgot",
      "POST",
      { email: String(form.get("email")), locale }
    );
    setDevToken(res.devToken ?? null);
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold">
        {t("Mot de passe oublié", "Forgot password")}
      </h1>
      {sent ? (
        <div className="mt-4 space-y-3 text-sm">
          <p>
            {t(
              "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
              "If an account exists with this email, a reset link has been sent."
            )}
          </p>
          {devToken && (
            <p className="rounded-lg bg-brand-50 p-3 text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
              {t("Mode développement — lien : ", "Development mode — link: ")}
              <Link
                className="font-medium underline"
                href={`/reset-password?token=${devToken}`}
              >
                {t("réinitialiser", "reset")}
              </Link>
            </p>
          )}
          <Link href="/login" className="text-brand-600 hover:underline">
            {t("Retour à la connexion", "Back to sign in")}
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            {t(
              "Saisissez votre email pour recevoir un lien.",
              "Enter your email to receive a link."
            )}
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">{t("Email", "Email")}</label>
              <input id="email" name="email" type="email" required className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t("Envoi…", "Sending…") : t("Envoyer le lien", "Send the link")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
