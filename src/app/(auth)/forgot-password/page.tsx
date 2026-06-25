"use client";

import Link from "next/link";
import { useState } from "react";
import { apiSend } from "@/lib/fetcher";

export default function ForgotPasswordPage() {
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
      { email: String(form.get("email")) }
    );
    setDevToken(res.devToken ?? null);
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
      {sent ? (
        <div className="mt-4 space-y-3 text-sm">
          <p>
            Si un compte existe avec cet email, un lien de réinitialisation a été
            envoyé.
          </p>
          {devToken && (
            <p className="rounded-lg bg-brand-50 p-3 text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
              Mode développement — lien :{" "}
              <Link
                className="font-medium underline"
                href={`/reset-password?token=${devToken}`}
              >
                réinitialiser
              </Link>
            </p>
          )}
          <Link href="/login" className="text-brand-600 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Saisissez votre email pour recevoir un lien.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
