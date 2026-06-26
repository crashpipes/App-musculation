"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
    { href: "/exercises", label: t("Exercices", "Exercises") },
    { href: "/profile", label: t("Profil", "Profile") },
    { href: "/settings", label: t("Réglages", "Settings") }
  ];

  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-extrabold">
          💪 <span className="text-brand-600">MuscuTrack</span>
        </Link>

        <nav className="hidden gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname.startsWith(l.href)
                  ? "bg-brand-600 text-white"
                  : "hover:bg-[rgb(var(--border))]/50"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-ghost hidden sm:inline-flex"
          >
            {t("Déconnexion", "Sign out")}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label={t("Déconnexion", "Sign out")}
            className="btn-ghost h-9 w-9 !px-0 sm:hidden"
          >
            ⏻
          </button>
        </div>
      </div>
    </header>
  );
}
