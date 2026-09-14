import { money } from "@/lib/format";

function statusColor(pctUsed: number) {
  if (pctUsed > 1) return "var(--critical)";
  if (pctUsed >= 0.85) return "var(--warning)";
  return "var(--good)";
}

export default function BudgetRemainingBanner({
  incomeActual,
  expensesActual,
  expensesPlanned,
}: {
  incomeActual: number;
  expensesActual: number;
  expensesPlanned: number;
}) {
  // Based on income you've actually received, not what's planned for the
  // whole month — so this never implies you have money you don't yet have.
  const available = incomeActual - expensesActual;
  const pctUsed =
    incomeActual > 0 ? expensesActual / incomeActual : expensesActual > 0 ? 1 : 0;
  const color = statusColor(pctUsed);
  const over = available < 0;

  return (
    <div className="card p-5 md:p-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm text-[var(--text-secondary)]">
          {over ? "Spent more than you've received by" : "Current balance"}
        </p>
        <p
          className="text-2xl md:text-3xl font-semibold tabular-nums"
          style={{ color }}
        >
          {money(Math.abs(available))}
        </p>
      </div>
      <p className="text-xs text-[var(--text-muted)] tabular-nums">
        {money(incomeActual)} received − {money(expensesActual)} spent
        <br />
        (budget plan: {money(expensesPlanned)}/mo)
      </p>
    </div>
  );
}
