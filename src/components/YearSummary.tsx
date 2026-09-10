import { money } from "@/lib/format";
import type { YearSummary as YearSummaryData } from "@/lib/budget";

export default function YearSummary({ data }: { data: YearSummaryData }) {
  const balancePositive = data.balanceActual >= 0;

  return (
    <div className="card p-5 md:p-6">
      <p className="text-sm font-medium text-[var(--text-secondary)] mb-4">
        Resumen {data.year} (año completo)
      </p>
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
    </div>
  );
}
