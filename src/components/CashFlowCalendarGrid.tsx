import { money } from "@/lib/format";
import type { MonthCashFlow } from "@/lib/budget";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CashFlowCalendarGrid({ data }: { data: MonthCashFlow }) {
  const firstWeekday = new Date(data.year, data.month - 1, 1).getDay();
  const leadingBlanks = Array.from({ length: firstWeekday });

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-xs text-[var(--text-muted)] py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {data.days.map((d) => {
          const hasIncome = d.income.length > 0;
          const hasBills = d.bills.length > 0;
          return (
            <div
              key={d.day}
              className="min-h-16 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-1 text-left"
            >
              <p className="text-xs text-[var(--text-muted)] tabular-nums">{d.day}</p>
              <div className="space-y-0.5 mt-0.5">
                {hasIncome && (
                  <p className="text-[10px] leading-tight tabular-nums" style={{ color: "var(--good)" }}>
                    +{money(d.income.reduce((s, e) => s + e.amount, 0))}
                  </p>
                )}
                {hasBills &&
                  d.bills.map((b, i) => (
                    <p
                      key={i}
                      className="text-[10px] leading-tight tabular-nums truncate"
                      style={{ color: "var(--critical)" }}
                      title={b.name}
                    >
                      −{money(b.amount)} {b.name}
                    </p>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
