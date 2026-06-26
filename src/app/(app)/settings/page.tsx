"use client";

import { useEffect, useState } from "react";
import { AI_PROVIDERS, DEFAULT_MODELS, type AiProvider } from "@/lib/ai";
import { apiGet, apiSend } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n";

interface SettingsResponse {
  provider: AiProvider | null;
  model: string | null;
  hasKey: boolean;
}

export default function SettingsPage() {
  const { t } = useI18n();
  const [provider, setProvider] = useState<AiProvider>("openai");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await apiGet<SettingsResponse>("/api/ai/settings");
    if (res.provider) setProvider(res.provider);
    setModel(res.model ?? "");
    setHasKey(res.hasKey);
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      await apiSend("/api/ai/settings", "PUT", {
        provider,
        apiKey,
        model: model || undefined
      });
      setApiKey("");
      setMsg(t("Configuration enregistrée ✓", "Configuration saved ✓"));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm(t("Supprimer la configuration IA ?", "Delete AI configuration?"))) return;
    await apiSend("/api/ai/settings", "DELETE");
    setHasKey(false);
    setModel("");
    setMsg(t("Configuration supprimée.", "Configuration removed."));
  }

  const current = AI_PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">{t("Réglages — Assistant IA", "Settings — AI Assistant")}</h1>

      <div className="card space-y-4">
        <p className="text-sm text-[rgb(var(--muted))]">
          {t(
            "Connecte ton propre compte IA pour estimer les calories et protéines de tes plats (photo ou liste d'aliments). Ta clé est stockée chiffrée et n'est jamais affichée.",
            "Connect your own AI account to estimate the calories and protein of your meals (photo or food list). Your key is stored encrypted and never shown."
          )}
        </p>

        {hasKey && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {t("Une clé est déjà configurée pour ", "A key is already configured for ")}
            {current?.label}.
          </p>
        )}

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">{t("Fournisseur", "Provider")}</label>
            <select className="input" value={provider} onChange={(e) => setProvider(e.target.value as AiProvider)}>
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            {current && (
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                {t("Obtiens ta clé sur ", "Get your key at ")}
                <a href={current.keyUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                  {current.keyUrl}
                </a>
              </p>
            )}
          </div>

          <div>
            <label className="label">{t("Modèle (optionnel)", "Model (optional)")}</label>
            <input className="input" placeholder={DEFAULT_MODELS[provider]} value={model} onChange={(e) => setModel(e.target.value)} />
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              {t("Par défaut : ", "Default: ")}{DEFAULT_MODELS[provider]}
            </p>
          </div>

          <div>
            <label className="label">{t("Clé API", "API key")}</label>
            <input
              type="password"
              className="input"
              placeholder={
                hasKey
                  ? t("•••••••• (laisser pour conserver)", "•••••••• (leave to keep)")
                  : t("Colle ta clé ici", "Paste your key here")
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required={!hasKey}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
            </button>
            {hasKey && (
              <button type="button" onClick={remove} className="btn-ghost text-red-500">
                {t("Supprimer", "Delete")}
              </button>
            )}
          </div>
        </form>
      </div>

      <p className="text-xs text-[rgb(var(--muted))]">
        {t(
          "Note : les estimations de l'IA sont approximatives et dépendent du modèle choisi. Les appels sont facturés sur ton propre compte chez le fournisseur.",
          "Note: AI estimates are approximate and depend on the chosen model. Calls are billed to your own account with the provider."
        )}
      </p>
    </div>
  );
}
