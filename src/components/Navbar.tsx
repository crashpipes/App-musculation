"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: "/dashboard", label: t("Tableau de bord", "Dashboard") },
    { href: "/tracking", label: t("Suivi", "Tracking") },
    { href: "/workout", label: t("Séance", "Workout") },
    { href: "/exercises", label: t("Exercices", "Exercises") },
    { href: "/routines", label: t("Programmes", "Routines") },
    { href: "/badges", label: t("Badges", "Badges") },
    { href: "/profile", label: t("Profil", "Profile") },
    { href: "/settings", label: t("Réglages", "Settings") }
  ];

  function logout() {
    haptic();
    signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="pt-safe sticky top-0 z-40 border-b-2 border-[rgb(var(--border))] bg-ink text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/dashboard"
          className="font-display text-lg font-bold uppercase tracking-wide"
        >
          MUSCU
          <span className="bg-[rgb(var(--accent))] px-1.5 text-ink">TRACK</span>
        </Link>

        <nav className="hidden gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 font-display text-sm font-medium uppercase tracking-wide transition",
                pathname.startsWith(l.href)
                  ? "bg-[rgb(var(--accent))] font-bold text-ink"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {/* Desktop : bouton texte */}
          <button
            onClick={logout}
            className="hidden rounded-md border-2 border-white/25 px-3 py-2 font-display text-xs font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))] sm:inline-flex"
          >
            {t("Déconnexion", "Sign out")}
          </button>
          {/* Mobile : icône "log out" claire + libellé court */}
          <button
            onClick={logout}
            aria-label={t("Déconnexion", "Sign out")}
            className="flex items-center gap-1.5 rounded-md border-2 border-white/25 px-2.5 py-2 text-red-400 sm:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="font-display text-xs font-semibold uppercase">
              {t("Quitter", "Log out")}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
