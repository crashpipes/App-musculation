"use client";

import { useEffect, useState } from "react";
import { AI_PROVIDERS, DEFAULT_MODELS, type AiProvider } from "@/lib/ai";
import { apiGet, apiSend } from "@/lib/fetcher";

interface SettingsResponse {
  provider: AiProvider | null;
  model: string | null;
  hasKey: boolean;
}

export default function SettingsPage() {
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
      setMsg("Configuration enregistrée ✓");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm("Supprimer la configuration IA ?")) return;
    await apiSend("/api/ai/settings", "DELETE");
    setHasKey(false);
    setModel("");
    setMsg("Configuration supprimée.");
  }

  const current = AI_PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Réglages — Assistant IA</h1>

      <div className="card space-y-4">
        <p className="text-sm text-[rgb(var(--muted))]">
          Connecte ton propre compte IA pour estimer les calories et protéines de
          tes plats (photo ou liste d&apos;aliments). Ta clé est stockée chiffrée et
          n&apos;est jamais affichée.
        </p>

        {hasKey && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Une clé est déjà configurée pour {current?.label}.
          </p>
        )}

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Fournisseur</label>
            <select
              className="input"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProvider)}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {current && (
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Obtiens ta clé sur{" "}
                <a
                  href={current.keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  {current.keyUrl}
                </a>
              </p>
            )}
          </div>

          <div>
            <label className="label">Modèle (optionnel)</label>
            <input
              className="input"
              placeholder={DEFAULT_MODELS[provider]}
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Par défaut : {DEFAULT_MODELS[provider]}
            </p>
          </div>

          <div>
            <label className="label">Clé API</label>
            <input
              type="password"
              className="input"
              placeholder={hasKey ? "•••••••• (laisser pour conserver)" : "Colle ta clé ici"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required={!hasKey}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
            {hasKey && (
              <button type="button" onClick={remove} className="btn-ghost text-red-500">
                Supprimer
              </button>
            )}
          </div>
        </form>
      </div>

      <p className="text-xs text-[rgb(var(--muted))]">
        Note : les estimations de l&apos;IA sont approximatives et dépendent du modèle
        choisi. Les appels sont facturés sur ton propre compte chez le fournisseur.
      </p>
    </div>
  );
}
