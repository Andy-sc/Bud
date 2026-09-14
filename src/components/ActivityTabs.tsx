import Link from "next/link";
import { ExpensesIcon, IncomeIcon, CalendarIcon } from "@/components/icons";

const TABS = [
  { href: "/expenses", label: "Expenses", Icon: ExpensesIcon },
  { href: "/income", label: "Income", Icon: IncomeIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
] as const;

// Mobile-only sub-nav shown at the top of Expenses/Income/Calendar — these
// three live under one "Activity" tab in the bottom nav, so this is how
// you switch between them once you're in there.
export default function ActivityTabs({
  active,
}: {
  active: "expenses" | "income" | "calendar";
}) {
  return (
    <div className="md:hidden flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-full p-1">
      {TABS.map(({ href, label, Icon }) => {
        const isActive = href === `/${active}`;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              isActive
                ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
