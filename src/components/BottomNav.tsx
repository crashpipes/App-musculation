"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    { href: "/dashboard", label: t("Accueil", "Home"), icon: "🏠" },
    { href: "/tracking", label: t("Suivi", "Track"), icon: "📊" },
    { href: "/workout", label: t("Séance", "Workout"), icon: "🏋️" },
    { href: "/exercises", label: t("Exos", "Library"), icon: "📚" },
    { href: "/profile", label: t("Profil", "Profile"), icon: "👤" }
  ];

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 backdrop-blur sm:hidden">
      {items.map((it) => {
        const active = pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => haptic()}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 font-display text-[10px] font-medium uppercase tracking-wide transition active:scale-95",
              active
                ? "font-bold text-[rgb(var(--foreground))]"
                : "text-[rgb(var(--muted))]"
            )}
          >
            {active && (
              <span className="absolute top-0 h-[3px] w-7 rounded-full bg-[rgb(var(--accent))]" />
            )}
            <span className="text-xl leading-none">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
