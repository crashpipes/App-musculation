"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";

// Bouton flottant "+" pour ajouter rapidement un repas (mobile uniquement).
export function QuickAddButton() {
  const pathname = usePathname();
  const { t } = useI18n();
  if (pathname.startsWith("/tracking")) return null;

  return (
    <Link
      href="/tracking"
      onClick={() => haptic()}
      aria-label={t("Ajouter un repas", "Add a meal")}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-3xl font-light text-white shadow-lg shadow-brand-600/30 transition active:scale-90 sm:hidden"
    >
      +
    </Link>
  );
}
