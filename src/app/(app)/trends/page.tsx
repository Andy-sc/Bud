import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyTrend } from "@/lib/budget";
import MonthlyTrendChart from "@/components/charts/MonthlyTrendChart";
import { money } from "@/lib/format";

interface Ym {
  year: number;
  month: number;
}

function nowYm(): Ym {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function parseYm(value: string | undefined, fallback: Ym): Ym {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return { year, month };
  }
  return fallback;
}

function fmtYm({ year, month }: Ym) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftYm({ year, month }: Ym, delta: number): Ym {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 };
}

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const now = nowYm();

  const from = parseYm(params.from, { year: now.year, month: 1 });
  const to = parseYm(params.to, { year: now.year, month: 12 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const trend = await getMonthlyTrend(
    supabase,
    userId,
    from.year,
    from.month,
    to.year,
    to.month
  );

  const totalIncome = trend.reduce((s, t) => s + t.incomeActual, 0);
  const totalExpenses = trend.reduce((s, t) => s + t.expensesActual, 0);
  const totalBalance = totalIncome - totalExpenses;

  const fromYm = fmtYm(from);
  const toYm = fmtYm(to);

  const last6From = fmtYm(shiftYm(now, -5));
  const last12From = fmtYm(shiftYm(now, -11));
  const nowYmStr = fmtYm(now);

  const presets = [
    { label: "This year", from: `${now.year}-01`, to: `${now.year}-12` },
    { label: "Last 6 months", from: last6From, to: nowYmStr },
    { label: "Last 12 months", from: last12From, to: nowYmStr },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Trends</h1>

      <div className="card p-4 md:p-5 space-y-4">
        <form className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">From</span>
            <input
              type="month"
              name="from"
              defaultValue={fromYm}
              className="control px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">To</span>
            <input
              type="month"
              name="to"
              defaultValue={toYm}
              className="control px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)]"
            />
          </label>
          <button
            type="submit"
            className="control px-4 py-2 text-sm font-medium text-[var(--accent-ink)] bg-[var(--accent)]"
          >
            Apply
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Link
              key={p.label}
              href={`/trends?from=${p.from}&to=${p.to}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] mb-1">Income</p>
          <p className="text-lg md:text-2xl font-semibold tabular-nums text-[var(--series-6)]">
            {money(totalIncome)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] mb-1">Expenses</p>
          <p className="text-lg md:text-2xl font-semibold tabular-nums text-[var(--series-8)]">
            {money(totalExpenses)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] mb-1">Balance</p>
          <p
            className="text-lg md:text-2xl font-semibold tabular-nums"
            style={{ color: totalBalance >= 0 ? "var(--good)" : "var(--critical)" }}
          >
            {money(totalBalance)}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
          Income vs Expenses by month
        </h3>
        <MonthlyTrendChart data={trend} />
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-[var(--text-primary)]">Export</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Download every expense and income entry between two months as a CSV.
        </p>
        <form className="flex flex-wrap items-end gap-3" action="/api/export" method="get">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">From</span>
            <input
              type="month"
              name="from"
              defaultValue={fromYm}
              required
              className="control px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">To</span>
            <input
              type="month"
              name="to"
              defaultValue={toYm}
              required
              className="control px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)]"
            />
          </label>
          <button
            type="submit"
            className="control px-4 py-2 text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
          >
            Download CSV
          </button>
        </form>
      </div>
    </div>
  );
}
