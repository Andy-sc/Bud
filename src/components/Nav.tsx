"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(app)/actions";

const LINKS = [
  { href: "/dashboard", label: "Resumen", icon: "📊" },
  { href: "/expenses", label: "Gastos", icon: "🧾" },
  { href: "/income", label: "Ingresos", icon: "💵" },
  { href: "/debts", label: "Deudas", icon: "📉" },
  { href: "/settings", label: "Categorías", icon: "⚙️" },
];

export default function Nav({ email }: { email?: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6">
        <div className="flex items-center gap-2 px-2 mb-8">
          <span className="text-2xl">💰</span>
          <span className="font-semibold text-[var(--text-primary)]">Bud</span>
        </div>
        <nav className="flex-1 space-y-1">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] text-sm font-medium transition ${
                  active
                    ? "bg-[color-mix(in_srgb,var(--series-1)_12%,transparent)] text-[var(--series-1)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <span aria-hidden>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pt-4 border-t border-[var(--border)] mt-4">
          {email && (
            <p className="text-xs text-[var(--text-muted)] truncate mb-2">{email}</p>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--critical)] transition"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="font-semibold text-[var(--text-primary)]">Bud</span>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-[var(--text-secondary)]">
            Salir
          </button>
        </form>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex bg-[var(--surface)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                active ? "text-[var(--series-1)]" : "text-[var(--text-muted)]"
              }`}
            >
              <span className="text-base" aria-hidden>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
