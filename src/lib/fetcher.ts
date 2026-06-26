"use client";

import { queueRequest } from "@/lib/offline";

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Erreur");
  return res.json() as Promise<T>;
}

// Renvoyé (structurellement) quand une écriture est mise en file hors-ligne.
export interface Queued {
  queued?: boolean;
}

export async function apiSend<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  // Hors-ligne : on met la requête en file et on continue (synchro au retour).
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    queueRequest(url, method, body);
    return { queued: true } as unknown as T;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    // Échec réseau (coupure) : on met en file.
    queueRequest(url, method, body);
    return { queued: true } as unknown as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Erreur");
  return data as T;
}
