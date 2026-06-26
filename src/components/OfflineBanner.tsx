"use client";

import { useEffect, useState } from "react";
import { flushOutbox, outboxCount } from "@/lib/offline";
import { useI18n } from "@/lib/i18n";
import { useWorkout } from "@/lib/workout";

export function OfflineBanner() {
  const { t } = useI18n();
  const { refresh } = useWorkout();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setPending(outboxCount());

    const onChange = () => setPending(outboxCount());
    const onOnline = async () => {
      setOnline(true);
      setSyncing(true);
      await flushOutbox();
      setPending(outboxCount());
      setSyncing(false);
      refresh();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("outbox-change", onChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("outbox-change", onChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  if (online && pending === 0) return null;

  return (
    <div
      className={`px-4 py-1.5 text-center text-xs font-medium text-white ${
        online ? "bg-amber-500" : "bg-zinc-600"
      }`}
    >
      {!online
        ? t(
            `Hors ligne — ${pending} action(s) en attente`,
            `Offline — ${pending} pending action(s)`
          )
        : syncing
          ? t("Synchronisation…", "Syncing…")
          : t(
              `${pending} action(s) à synchroniser`,
              `${pending} action(s) to sync`
            )}
    </div>
  );
}
