"use client";

import { SunIcon, MoonIcon } from "@/components/icons";

type Theme = "light" | "dark";

function toggleTheme() {
  const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const next: Theme = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    window.localStorage.setItem("bud-theme", next);
  } catch {
    // ignore (private mode / storage blocked)
  }
}

// Both icons render always; globals.css shows only the one matching the
// current data-theme so no React state (and no effect) is needed to pick
// between them — the no-FOUC script already sets data-theme before paint.
export default function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition"
    >
      <SunIcon className="w-[18px] h-[18px] theme-toggle-icon theme-toggle-icon-sun" />
      <MoonIcon className="w-[18px] h-[18px] theme-toggle-icon theme-toggle-icon-moon" />
    </button>
  );
}
