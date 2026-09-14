"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(app)/actions";
import ThemeToggle from "@/components/ThemeToggle";
import {
  LogoMark,
  OverviewIcon,
  ExpensesIcon,
  IncomeIcon,
  GoalsIcon,
  CalendarIcon,
  DebtsIcon,
  SettingsIcon,
  PlusIcon,
  SignOutIcon,
} from "@/components/icons";

// Desktop pill nav — a flat list is fine here (confirmed with the user).
// Settings lives as its own icon in the header instead of a tab.
const LINKS = [
  { href: "/dashboard", label: "Overview", Icon: OverviewIcon },
  { href: "/expenses", label: "Expenses", Icon: ExpensesIcon },
  { href: "/income", label: "Income", Icon: IncomeIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/goals", label: "Goals", Icon: GoalsIcon },
  { href: "/debts", label: "Debts", Icon: DebtsIcon },
];

// Mobile bottom nav: Home, Calendar, + (add), Debts, Goals.
const MOBILE_LINKS = [
  { href: "/dashboard", label: "Home", Icon: OverviewIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
];
const MOBILE_LINKS_RIGHT = [
  { href: "/debts", label: "Debts", Icon: DebtsIcon },
  { href: "/goals", label: "Goals", Icon: GoalsIcon },
];

function tabClass(active: boolean) {
  return `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
    active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
  }`;
}

export default function Nav({ email }: { email?: string }) {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-[var(--page)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-4 px-4 md:px-8 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <LogoMark className="w-6 h-6" />
            <span className="font-semibold text-[var(--text-primary)]">Bud</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-full p-1 mx-auto">
            {LINKS.map(({ href, label, Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {email && (
              <p className="hidden lg:block text-xs text-[var(--text-muted)] truncate max-w-[160px]">
                {email}
              </p>
            )}
            <Link
              href="/settings"
              aria-label="Settings"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition ${
                pathname.startsWith("/settings")
                  ? "text-[var(--accent)] bg-[var(--surface-2)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }`}
            >
              <SettingsIcon className="w-[18px] h-[18px]" />
            </Link>
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--critical)] transition"
              >
                <SignOutIcon className="w-[18px] h-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav: Home / Calendar / + / Debts / Goals */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20">
        {addOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 bg-transparent"
            onClick={() => setAddOpen(false)}
          />
        )}

        {addOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20 flex flex-col gap-2 items-center">
            <Link
              href="/income"
              onClick={() => setAddOpen(false)}
              className="control px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] shadow-sm whitespace-nowrap"
            >
              Add income
            </Link>
            <Link
              href="/expenses"
              onClick={() => setAddOpen(false)}
              className="control px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] shadow-sm whitespace-nowrap"
            >
              Add expense
            </Link>
          </div>
        )}

        <div className="relative z-20 flex items-center bg-[var(--surface)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
          {MOBILE_LINKS.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={tabClass(pathname.startsWith(href))}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}

          <button
            type="button"
            aria-label="Add expense or income"
            onClick={() => setAddOpen((v) => !v)}
            className="flex-1 flex flex-col items-center justify-center -mt-5"
          >
            <span className="w-12 h-12 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] flex items-center justify-center shadow-md">
              <PlusIcon className="w-6 h-6" />
            </span>
          </button>

          {MOBILE_LINKS_RIGHT.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={tabClass(pathname.startsWith(href))}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
