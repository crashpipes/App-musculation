// File d'attente locale pour les écritures effectuées hors-ligne.
// Les requêtes sont rejouées dans l'ordre dès le retour du réseau.

export interface OutboxItem {
  id: string;
  url: string;
  method: string;
  body?: unknown;
  ts: number;
}

const KEY = "muscu.outbox";

function read(): OutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as OutboxItem[];
  } catch {
    return [];
  }
}

function write(items: OutboxItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("outbox-change"));
}

export function queueRequest(url: string, method: string, body?: unknown): void {
  const items = read();
  items.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url,
    method,
    body,
    ts: Date.now()
  });
  write(items);
}

export function outboxCount(): number {
  return read().length;
}

// Rejoue la file dans l'ordre. S'arrête à la première erreur réseau / serveur.
export async function flushOutbox(): Promise<number> {
  let items = read();
  while (items.length > 0) {
    const it = items[0]!;
    try {
      const res = await fetch(it.url, {
        method: it.method,
        headers: it.body ? { "Content-Type": "application/json" } : undefined,
        body: it.body ? JSON.stringify(it.body) : undefined
      });
      // 5xx : on réessaiera plus tard ; 2xx/4xx : on retire de la file
      if (res.status >= 500) break;
    } catch {
      break; // toujours hors-ligne
    }
    items = read().slice(1);
    write(items);
  }
  return items.length;
}
