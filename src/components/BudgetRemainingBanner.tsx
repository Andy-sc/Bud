import { money } from "@/lib/format";

function statusColor(pctUsed: number) {
  if (pctUsed > 1) return "var(--critical)";
  if (pctUsed >= 0.85) return "var(--warning)";
  return "var(--good)";
}

export default function BudgetRemainingBanner({
  expensesPlanned,
  expensesActual,
}: {
  expensesPlanned: number;
  expensesActual: number;
}) {
  const remaining = expensesPlanned - expensesActual;
  const pctUsed = expensesPlanned > 0 ? expensesActual / expensesPlanned : expensesActual > 0 ? 1 : 0;
  const color = statusColor(pctUsed);
  const over = remaining < 0;

  return (
    <div className="card p-5 md:p-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm text-[var(--text-secondary)]">
          {over ? "Over your planned budget by" : "Left to spend this month"}
        </p>
        <p
          className="text-2xl md:text-3xl font-semibold tabular-nums"
          style={{ color }}
        >
          {money(Math.abs(remaining))}
        </p>
      </div>
      <p className="text-xs text-[var(--text-muted)] tabular-nums">
        {money(expensesActual)} spent of {money(expensesPlanned)} planned
      </p>
    </div>
  );
}
