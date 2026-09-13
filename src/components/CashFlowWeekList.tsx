import { money } from "@/lib/format";
import type { MonthCashFlow } from "@/lib/budget";
import DueDayEditor from "@/components/DueDayEditor";

export default function CashFlowWeekList({ data }: { data: MonthCashFlow }) {
  return (
    <div className="space-y-3">
      {data.weeks.map((week) => {
        const totalIncome = week.incomeActual + week.incomeProjected;
        const over = week.freeToSpend < 0;
        return (
          <div
            key={week.label}
            className="border border-[var(--border)] rounded-[var(--radius-control)] p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-[var(--text-primary)]">Days {week.label}</p>
              <p
                className="text-sm font-semibold tabular-nums"
                style={{ color: over ? "var(--critical)" : "var(--good)" }}
              >
                {over ? "−" : ""}
                {money(Math.abs(week.freeToSpend))} free
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="tabular-nums">
                Income: {money(totalIncome)}
                {week.incomeProjected > 0 && (
                  <span className="text-[var(--text-muted)]">
                    {" "}
                    ({money(week.incomeActual)} received + {money(week.incomeProjected)}{" "}
                    expected)
                  </span>
                )}
              </span>
              <span className="tabular-nums">Bills: {money(week.billsTotal)}</span>
            </div>

            {week.bills.length > 0 && (
              <ul className="text-xs text-[var(--text-muted)] space-y-0.5 pt-1 border-t border-[var(--border)]">
                {week.bills.map((b, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <DueDayEditor subcategoryId={b.subcategoryId} day={b.day} />
                      <span>· {b.name}</span>
                    </span>
                    <span className="tabular-nums">{money(b.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
