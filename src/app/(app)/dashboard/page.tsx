import { createClient } from "@/lib/supabase/server";
import {
  getAccountSummary,
  getMonthBudget,
  getSpendingByAccount,
  getYearSummary,
} from "@/lib/budget";
import { currentYearMonth } from "@/lib/date";
import MonthNav from "@/components/MonthNav";
import YearSummary from "@/components/YearSummary";
import BudgetRemainingBanner from "@/components/BudgetRemainingBanner";
import IncomeCard from "@/components/IncomeCard";
import CategoryCard from "@/components/CategoryCard";
import PlannedVsActualChart from "@/components/charts/PlannedVsActualChart";
import SpendingByAccountChart from "@/components/charts/SpendingByAccountChart";
import AccountSummary from "@/components/AccountSummary";
import { money } from "@/lib/format";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = currentYearMonth();
  const year = params.year ? parseInt(params.year, 10) : now.year;
  const month = params.month ? parseInt(params.month, 10) : now.month;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [budget, yearSummary, accountSpending, accountSummary] = await Promise.all([
    getMonthBudget(supabase, userId, year, month),
    getYearSummary(supabase, userId, year),
    getSpendingByAccount(supabase, userId, year, month),
    getAccountSummary(supabase, userId),
  ]);

  const chartData = budget.categories.map((c) => ({
    name: c.name,
    planned: c.planned,
    actual: c.actual,
    pctUsed: c.pctUsed,
  }));

  const balanceActual = budget.incomeActual - budget.expensesActual;

  return (
    <div className="space-y-6">
      <BudgetRemainingBanner
        incomeActual={budget.incomeActual}
        expensesActual={budget.expensesActual}
        expensesPlanned={budget.expensesPlanned}
      />

      <YearSummary data={yearSummary} />

      <AccountSummary data={accountSummary} />

      <div className="card p-4 md:p-5">
        <MonthNav year={year} month={month} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <IncomeCard
          year={year}
          month={month}
          planned={budget.incomePlanned}
          actual={budget.incomeActual}
        />
        <div className="card p-5 space-y-1">
          <p className="text-xs text-[var(--text-muted)]">Total Expenses (month)</p>
          <p className="text-lg font-semibold tabular-nums text-[var(--series-8)]">
            {money(budget.expensesActual)}
          </p>
          <p className="text-xs text-[var(--text-muted)] tabular-nums">
            of {money(budget.expensesPlanned)} planned
          </p>
        </div>
        <div className="card p-5 space-y-1">
          <p className="text-xs text-[var(--text-muted)]">Balance (month)</p>
          <p
            className="text-lg font-semibold tabular-nums"
            style={{ color: balanceActual >= 0 ? "var(--good)" : "var(--critical)" }}
          >
            {money(balanceActual)}
          </p>
          <p className="text-xs text-[var(--text-muted)] tabular-nums">
            plan {money(budget.balancePlanned)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">
            Planned vs Actual by category
          </h3>
          <PlannedVsActualChart data={chartData} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">
            Spending by account
          </h3>
          <SpendingByAccountChart data={accountSpending} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {budget.categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            year={year}
            month={month}
            incomePlanned={budget.incomePlanned}
          />
        ))}
      </div>
    </div>
  );
}
