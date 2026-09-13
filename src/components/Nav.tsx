"use client";

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
  CategoriesIcon,
  SignOutIcon,
} from "@/components/icons";

const LINKS = [
  { href: "/dashboard", label: "Overview", Icon: OverviewIcon },
  { href: "/expenses", label: "Expenses", Icon: ExpensesIcon },
  { href: "/income", label: "Income", Icon: IncomeIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/goals", label: "Goals", Icon: GoalsIcon },
  { href: "/debts", label: "Debts", Icon: DebtsIcon },
  { href: "/settings", label: "Categories", Icon: CategoriesIcon },
];

export default function Nav({ email }: { email?: string }) {
  const pathname = usePathname();

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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex bg-[var(--surface)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
        {LINKS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
