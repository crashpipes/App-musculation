// Couche d'abstraction multi-fournisseurs pour l'estimation nutritionnelle.
// Chaque utilisateur fournit sa propre clé API. Appels effectués côté serveur.

export type AiProvider = "openai" | "anthropic" | "google";

export const AI_PROVIDERS: { id: AiProvider; label: string; keyUrl: string }[] = [
  { id: "openai", label: "OpenAI (GPT-4o)", keyUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic (Claude)", keyUrl: "https://console.anthropic.com/settings/keys" },
  { id: "google", label: "Google (Gemini)", keyUrl: "https://aistudio.google.com/app/apikey" }
];

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  google: "gemini-2.5-flash"
};

export interface FoodItem {
  name: string;
  grams: number;
}

export interface EstimateResult {
  calories: number;
  proteinG: number;
  label: string;
  note: string;
}

export interface EstimateInput {
  provider: AiProvider;
  apiKey: string;
  model?: string | null;
  mode: "photo" | "foods";
  imageBase64?: string;
  mimeType?: string;
  foods?: FoodItem[];
}

const SYSTEM_INSTRUCTION =
  "Tu es un nutritionniste. Estime les calories totales et les protéines totales (en grammes) du plat. " +
  'Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format exact : ' +
  '{"calories": <entier>, "proteinG": <entier>, "label": "<nom court du plat>", "note": "<courte explication en français>"}.';

function buildUserText(input: EstimateInput): string {
  if (input.mode === "foods" && input.foods?.length) {
    const list = input.foods.map((f) => `${f.grams} g de ${f.name}`).join(", ");
    return `Plat composé de : ${list}. Estime les calories et protéines totales.`;
  }
  return "Estime les calories et protéines totales du plat sur la photo.";
}

function parseResult(raw: string): EstimateResult {
  let text = raw.trim();
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Réponse IA illisible");
  const obj = JSON.parse(text.slice(start, end + 1)) as Partial<EstimateResult>;
  return {
    calories: Math.max(0, Math.round(Number(obj.calories ?? 0))),
    proteinG: Math.max(0, Math.round(Number(obj.proteinG ?? 0))),
    label: String(obj.label ?? "Plat").slice(0, 60),
    note: String(obj.note ?? "").slice(0, 300)
  };
}

async function providerError(res: Response): Promise<Error> {
  let message = `HTTP ${res.status}`;
  try {
    const j = (await res.json()) as { error?: { message?: string }; message?: string };
    message = j?.error?.message ?? j?.message ?? JSON.stringify(j);
  } catch {
    try {
      message = await res.text();
    } catch {
      // ignore
    }
  }
  if (res.status === 401 || res.status === 403) return new Error("AI_AUTH");
  return new Error(`AI_PROVIDER:${res.status}:${String(message).slice(0, 300)}`);
}

async function callOpenAI(input: EstimateInput, text: string): Promise<string> {
  const content: unknown[] = [{ type: "text", text }];
  if (input.mode === "photo" && input.imageBase64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${input.mimeType ?? "image/jpeg"};base64,${input.imageBase64}` }
    });
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.apiKey}` },
    body: JSON.stringify({
      model: input.model || DEFAULT_MODELS.openai,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content }
      ],
      max_tokens: 300
    })
  });
  if (!res.ok) throw await providerError(res);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(input: EstimateInput, text: string): Promise<string> {
  const content: unknown[] = [{ type: "text", text }];
  if (input.mode === "photo" && input.imageBase64) {
    content.unshift({
      type: "image",
      source: { type: "base64", media_type: input.mimeType ?? "image/jpeg", data: input.imageBase64 }
    });
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: input.model || DEFAULT_MODELS.anthropic,
      max_tokens: 300,
      system: SYSTEM_INSTRUCTION,
      messages: [{ role: "user", content }]
    })
  });
  if (!res.ok) throw await providerError(res);
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.[0]?.text ?? "";
}

async function callGoogle(input: EstimateInput, text: string): Promise<string> {
  const parts: unknown[] = [{ text: `${SYSTEM_INSTRUCTION}\n\n${text}` }];
  if (input.mode === "photo" && input.imageBase64) {
    parts.push({ inline_data: { mime_type: input.mimeType ?? "image/jpeg", data: input.imageBase64 } });
  }
  const model = input.model || DEFAULT_MODELS.google;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${input.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] })
  });
  if (!res.ok) throw await providerError(res);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function estimateNutrition(input: EstimateInput): Promise<EstimateResult> {
  const text = buildUserText(input);
  let raw: string;
  if (input.provider === "openai") raw = await callOpenAI(input, text);
  else if (input.provider === "anthropic") raw = await callAnthropic(input, text);
  else raw = await callGoogle(input, text);
  return parseResult(raw);
}
