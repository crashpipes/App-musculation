"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/tracking", label: "Suivi" },
  { href: "/exercises", label: "Exercices" },
  { href: "/profile", label: "Profil" }
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-extrabold">
          💪 <span className="text-brand-600">MuscuTrack</span>
        </Link>

        <nav className="hidden gap-1 sm:flex">
          {LINKS.map((l) => (
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
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-ghost"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Navigation mobile */}
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
              pathname.startsWith(l.href)
                ? "bg-brand-600 text-white"
                : "border border-[rgb(var(--border))]"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
