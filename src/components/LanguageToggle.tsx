"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, toggle } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Changer de langue / Switch language"
      className="btn-ghost h-9 px-3 text-xs font-semibold"
    >
      {locale === "fr" ? "EN" : "FR"}
    </button>
  );
}
