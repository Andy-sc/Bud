import Link from "next/link";
import { money } from "@/lib/format";
import { ChevronRightIcon } from "@/components/icons";
import type { YearSummary as YearSummaryData } from "@/lib/budget";

export default function YearSummary({ data }: { data: YearSummaryData }) {
  const balancePositive = data.balanceActual >= 0;
  const yyyy = String(data.year).padStart(4, "0");

  return (
    <Link
      href={`/trends?from=${yyyy}-01&to=${yyyy}-12`}
      className="card p-5 md:p-6 block hover:border-[var(--accent)] transition"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {data.year} summary (full year)
        </p>
        <ChevronRightIcon className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">Income</p>
          <p className="text-lg md:text-2xl font-semibold tabular-nums text-[var(--series-6)]">
            {money(data.incomeActual)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">Total Expenses</p>
          <p className="text-lg md:text-2xl font-semibold tabular-nums text-[var(--series-8)]">
            {money(data.expensesActual)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">Balance</p>
          <p
            className="text-lg md:text-2xl font-semibold tabular-nums"
            style={{ color: balancePositive ? "var(--good)" : "var(--critical)" }}
          >
            {money(data.balanceActual)}
          </p>
        </div>
      </div>
    </Link>
  );
}
