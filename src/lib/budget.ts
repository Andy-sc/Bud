import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange, shiftMonth } from "@/lib/date";
import type {
  Account,
  AccountType,
  Category,
  Debt,
  Goal,
  Income,
  NotificationPreferences,
  Subcategory,
} from "@/lib/database.types";

export interface SubcategoryComputed extends Subcategory {
  actual: number;
  planned: number;
  diff: number;
  pctUsed: number;
}

export interface CategoryComputed extends Category {
  subcategories: SubcategoryComputed[];
  planned: number;
  actual: number;
  diff: number;
  pctUsed: number;
}

export interface MonthBudget {
  year: number;
  month: number;
  incomePlanned: number;
  incomeActual: number;
  incomeDiff: number;
  expensesPlanned: number;
  expensesActual: number;
  expensesDiff: number;
  balancePlanned: number;
  balanceActual: number;
  categories: CategoryComputed[];
}

function pct(actual: number, planned: number) {
  if (!planned) return actual > 0 ? 1 : 0;
  return actual / planned;
}

export async function getCategoriesWithSubcategories(
  supabase: SupabaseClient,
  userId: string
): Promise<(Category & { subcategories: Subcategory[] })[]> {
  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order"),
    supabase
      .from("subcategories")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order"),
  ]);

  return (categories ?? []).map((cat: Category) => ({
    ...cat,
    subcategories: (subcategories ?? []).filter(
      (s: Subcategory) => s.category_id === cat.id
    ),
  }));
}

export async function getAccounts(
  supabase: SupabaseClient,
  userId: string
): Promise<Account[]> {
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");
  return data ?? [];
}

export async function getMonthBudget(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number,
  options: { includeRollover?: boolean } = {}
): Promise<MonthBudget> {
  const includeRollover = options.includeRollover ?? true;
  const { start, end } = monthRange(year, month);

  const [
    categoriesResult,
    overridesResult,
    fixedActualsResult,
    expensesResult,
    debtPaymentsResult,
    debtsResult,
    incomePlanResult,
    userSettingsResult,
    incomeResult,
  ] = await Promise.all([
    getCategoriesWithSubcategories(supabase, userId),
    supabase
      .from("monthly_overrides")
      .select("*")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month),
    supabase
      .from("fixed_actuals")
      .select("*")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month),
    supabase
      .from("expenses")
      .select("amount, subcategory_id")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end),
    supabase
      .from("debt_payments")
      .select("amount, debt_id")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end),
    supabase.from("debts").select("*").eq("user_id", userId),
    supabase
      .from("income_plan")
      .select("*")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle(),
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("income")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end),
  ]);

  const overridesBySubcat = new Map<string, number>();
  for (const o of overridesResult.data ?? []) {
    overridesBySubcat.set(o.subcategory_id, Number(o.planned_amount));
  }

  const fixedActualBySubcat = new Map<string, number>();
  for (const f of fixedActualsResult.data ?? []) {
    fixedActualBySubcat.set(f.subcategory_id, Number(f.actual_amount));
  }

  const expensesBySubcat = new Map<string, number>();
  for (const e of expensesResult.data ?? []) {
    expensesBySubcat.set(
      e.subcategory_id,
      (expensesBySubcat.get(e.subcategory_id) ?? 0) + Number(e.amount)
    );
  }

  const debtPaymentsByDebt = new Map<string, number>();
  for (const p of debtPaymentsResult.data ?? []) {
    debtPaymentsByDebt.set(
      p.debt_id,
      (debtPaymentsByDebt.get(p.debt_id) ?? 0) + Number(p.amount)
    );
  }

  const debtsById = new Map<string, Debt>();
  for (const d of debtsResult.data ?? []) {
    debtsById.set(d.id, d);
  }

  const categories: CategoryComputed[] = categoriesResult.map((cat) => {
    const subcategories: SubcategoryComputed[] = cat.subcategories.map(
      (sub) => {
        const planned = overridesBySubcat.get(sub.id) ?? Number(sub.planned_amount);
        let actual = 0;
        if (sub.type === "variable") {
          actual = expensesBySubcat.get(sub.id) ?? 0;
        } else if (sub.type === "fixed") {
          // Additive: the hand-typed monthly total (dashboard card) plus
          // any itemized expenses logged for it from the Expenses page —
          // either path (or both together) counts toward the total.
          actual =
            (fixedActualBySubcat.get(sub.id) ?? 0) +
            (expensesBySubcat.get(sub.id) ?? 0);
        } else if (sub.type === "debt" && sub.debt_id) {
          actual = debtPaymentsByDebt.get(sub.debt_id) ?? 0;
        }
        return {
          ...sub,
          planned,
          actual,
          diff: planned - actual,
          pctUsed: pct(actual, planned),
        };
      }
    );

    const planned = subcategories.reduce((s, x) => s + x.planned, 0);
    const actual = subcategories.reduce((s, x) => s + x.actual, 0);

    return {
      ...cat,
      subcategories,
      planned,
      actual,
      diff: planned - actual,
      pctUsed: pct(actual, planned),
    };
  });

  if (includeRollover) {
    const prev = shiftMonth(year, month, -1);
    const { data: firstCategory } = await supabase
      .from("categories")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const startedAt = firstCategory ? new Date(firstCategory.created_at) : null;
    const isPrevTheStartingMonth =
      startedAt !== null &&
      startedAt.getFullYear() === prev.year &&
      startedAt.getMonth() + 1 === prev.month;

    // Skip rolling over from the very first month you used the app — it's
    // typically an incomplete/partial month (categories were still being
    // set up), so its "leftover" isn't real underspending.
    if (!isPrevTheStartingMonth) {
      const prevBudget = await getMonthBudget(supabase, userId, prev.year, prev.month, {
        includeRollover: false,
      });
      const leftover = prevBudget.categories
        .flatMap((c) => c.subcategories)
        .filter((s) => s.type !== "debt")
        .reduce((sum, s) => sum + Math.max(s.planned - s.actual, 0), 0);

      if (leftover > 0) {
        for (const cat of categories) {
          const bufferSub = cat.subcategories.find((s) => s.is_buffer);
          if (!bufferSub) continue;
          bufferSub.planned += leftover;
          bufferSub.diff = bufferSub.planned - bufferSub.actual;
          bufferSub.pctUsed = pct(bufferSub.actual, bufferSub.planned);
          cat.planned += leftover;
          cat.diff = cat.planned - cat.actual;
          cat.pctUsed = pct(cat.actual, cat.planned);
          break;
        }
      }
    }
  }

  const expensesPlanned = categories.reduce((s, c) => s + c.planned, 0);
  const expensesActual = categories.reduce((s, c) => s + c.actual, 0);

  const incomePlanned =
    incomePlanResult.data?.planned_amount != null
      ? Number(incomePlanResult.data.planned_amount)
      : Number(userSettingsResult.data?.default_income_planned ?? 0);
  const incomeActual = (incomeResult.data ?? []).reduce(
    (s, r) => s + Number(r.amount),
    0
  );

  return {
    year,
    month,
    incomePlanned,
    incomeActual,
    incomeDiff: incomePlanned - incomeActual,
    expensesPlanned,
    expensesActual,
    expensesDiff: expensesPlanned - expensesActual,
    balancePlanned: incomePlanned - expensesPlanned,
    balanceActual: incomeActual - expensesActual,
    categories,
  };
}

export interface YearSummary {
  year: number;
  incomeActual: number;
  expensesActual: number;
  balanceActual: number;
}

export async function getYearSummary(
  supabase: SupabaseClient,
  userId: string,
  year: number
): Promise<YearSummary> {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  const [
    { data: incomeRows },
    { data: expenseRows },
    { data: fixedActualRows },
    { data: debtPaymentRows },
  ] = await Promise.all([
    supabase
      .from("income")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end),
    supabase
      .from("fixed_actuals")
      .select("actual_amount")
      .eq("user_id", userId)
      .eq("year", year),
    supabase
      .from("debt_payments")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end),
  ]);

  const incomeActual = (incomeRows ?? []).reduce(
    (s, r) => s + Number(r.amount),
    0
  );
  const expensesActual =
    (expenseRows ?? []).reduce((s, r) => s + Number(r.amount), 0) +
    (fixedActualRows ?? []).reduce((s, r) => s + Number(r.actual_amount), 0) +
    (debtPaymentRows ?? []).reduce((s, r) => s + Number(r.amount), 0);

  return {
    year,
    incomeActual,
    expensesActual,
    balanceActual: incomeActual - expensesActual,
  };
}

export interface DebtComputed extends Debt {
  paidSoFar: number;
  currentBalance: number;
  pctPaid: number;
  plannedMonthlyPayment: number;
  subcategoryId: string | null;
}

export async function getDebtsWithBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<DebtComputed[]> {
  const [{ data: debts }, { data: payments }, { data: subcategories }] =
    await Promise.all([
      supabase
        .from("debts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at"),
      supabase.from("debt_payments").select("debt_id, amount").eq("user_id", userId),
      supabase
        .from("subcategories")
        .select("id, debt_id, planned_amount")
        .eq("user_id", userId)
        .eq("type", "debt"),
    ]);

  const paidByDebt = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByDebt.set(p.debt_id, (paidByDebt.get(p.debt_id) ?? 0) + Number(p.amount));
  }

  const subcatByDebt = new Map<string, { id: string; planned_amount: number }>();
  for (const s of subcategories ?? []) {
    if (s.debt_id) subcatByDebt.set(s.debt_id, s);
  }

  return (debts ?? []).map((d: Debt) => {
    const paidSoFar = paidByDebt.get(d.id) ?? 0;
    const original = Number(d.original_amount);
    const linkedSub = subcatByDebt.get(d.id);
    return {
      ...d,
      paidSoFar,
      currentBalance: original - paidSoFar,
      pctPaid: original ? paidSoFar / original : 0,
      plannedMonthlyPayment: linkedSub ? Number(linkedSub.planned_amount) : 0,
      subcategoryId: linkedSub?.id ?? null,
    };
  });
}

export type PayoffEstimate =
  | { status: "paid-off" }
  | { status: "no-payment" }
  | { status: "payment-too-low" }
  | { status: "ok"; months: number; payoffDate: Date };

/**
 * Standard loan-amortization payoff estimate: given a balance, an annual
 * interest rate, and a fixed monthly payment, how many months until the
 * balance reaches zero. Interest-free debts (rate 0) just divide balance
 * by payment.
 */
export function estimatePayoff(
  balance: number,
  annualRatePct: number,
  monthlyPayment: number,
  from: Date = new Date()
): PayoffEstimate {
  if (balance <= 0) return { status: "paid-off" };
  if (monthlyPayment <= 0) return { status: "no-payment" };

  const r = annualRatePct / 100 / 12;
  let months: number;

  if (r === 0) {
    months = Math.ceil(balance / monthlyPayment);
  } else {
    if (monthlyPayment <= balance * r) {
      return { status: "payment-too-low" };
    }
    months = Math.ceil(
      -Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r)
    );
  }

  const payoffDate = new Date(from.getFullYear(), from.getMonth() + months, 1);
  return { status: "ok", months, payoffDate };
}

export interface AccountSpending {
  accountId: string | null;
  accountName: string;
  amount: number;
}

export async function getSpendingByAccount(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<AccountSpending[]> {
  const { start, end } = monthRange(year, month);

  const [accounts, { data: expenses }, { data: debtPayments }] =
    await Promise.all([
      getAccounts(supabase, userId),
      supabase
        .from("expenses")
        .select("amount, account_id")
        .eq("user_id", userId)
        .gte("date", start)
        .lt("date", end),
      supabase
        .from("debt_payments")
        .select("amount, account_id")
        .eq("user_id", userId)
        .gte("date", start)
        .lt("date", end),
    ]);

  const nameById = new Map<string, string>();
  for (const a of accounts) nameById.set(a.id, a.name);

  const totals = new Map<string, number>();
  for (const row of [...(expenses ?? []), ...(debtPayments ?? [])]) {
    const key = row.account_id ?? "no-account";
    totals.set(key, (totals.get(key) ?? 0) + Number(row.amount));
  }

  return Array.from(totals.entries()).map(([key, amount]) => ({
    accountId: key === "no-account" ? null : key,
    accountName: key === "no-account" ? "No account" : nameById.get(key) ?? "?",
    amount,
  }));
}

export interface CashFlowIncomeEvent {
  amount: number;
  source: string;
  actual: boolean; // false = projected from a recurring pattern, not yet logged
}

export interface CashFlowBillEvent {
  subcategoryId: string;
  name: string;
  categoryName: string;
  amount: number;
}

export interface CashFlowDay {
  day: number;
  date: string;
  income: CashFlowIncomeEvent[];
  bills: CashFlowBillEvent[];
  // Running balance through the end of this day: starting balance + every
  // income event so far this month - every bill so far this month. Goes
  // negative the moment scheduled bills outpace money actually available.
  runningBalance: number;
}

export interface UnscheduledBill {
  subcategoryId: string;
  name: string;
  categoryName: string;
  amount: number;
}

export interface CashFlowWeek {
  label: string;
  startDay: number;
  endDay: number;
  incomeActual: number;
  incomeProjected: number;
  bills: (CashFlowBillEvent & { day: number })[];
  billsTotal: number;
  freeToSpend: number;
}

export interface MonthCashFlow {
  year: number;
  month: number;
  days: CashFlowDay[];
  weeks: CashFlowWeek[];
  unscheduled: UnscheduledBill[];
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addOneMonth(date: Date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Projects future occurrences of recurring income into [rangeStart, rangeEnd)
 * using the most recent recurring entry per `source` as the pattern (its
 * amount + interval), stepping forward from its date. Skips any projected
 * date that already has a matching actual entry (same source + date) so a
 * paycheck already logged isn't double-counted as also "expected".
 */
export function projectRecurringIncome(
  recurringRows: Income[],
  actualDatesBySource: Set<string>,
  rangeStart: Date,
  rangeEnd: Date
): { date: string; amount: number; source: string }[] {
  const latestBySource = new Map<string, Income>();
  for (const row of recurringRows) {
    const key = row.source ?? "Income";
    const existing = latestBySource.get(key);
    if (!existing || row.date > existing.date) latestBySource.set(key, row);
  }

  const projections: { date: string; amount: number; source: string }[] = [];

  for (const [source, anchor] of latestBySource) {
    if (!anchor.recurrence_interval) continue;
    let date = new Date(`${anchor.date}T00:00:00`);
    // Step forward until we're past the end of the range, collecting any
    // occurrence that lands inside [rangeStart, rangeEnd).
    // Cap iterations defensively so a bad interval can't loop forever.
    for (let i = 0; i < 400; i++) {
      date =
        anchor.recurrence_interval === "weekly"
          ? addDays(date, 7)
          : anchor.recurrence_interval === "biweekly"
            ? addDays(date, 14)
            : addOneMonth(date);
      if (date >= rangeEnd) break;
      if (date >= rangeStart) {
        const iso = toISODate(date);
        if (!actualDatesBySource.has(`${source}|${iso}`)) {
          projections.push({ date: iso, amount: Number(anchor.amount), source });
        }
      }
    }
  }

  return projections;
}

export async function getMonthCashFlow(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number,
  startingBalance = 0
): Promise<MonthCashFlow> {
  const { start, end } = monthRange(year, month);
  const rangeStart = new Date(`${start}T00:00:00`);
  const rangeEnd = new Date(`${end}T00:00:00`);
  const numDays = daysInMonth(year, month);

  const [{ data: incomeInMonth }, { data: recurringIncome }, categories] =
    await Promise.all([
      supabase
        .from("income")
        .select("*")
        .eq("user_id", userId)
        .gte("date", start)
        .lt("date", end),
      supabase
        .from("income")
        .select("*")
        .eq("user_id", userId)
        .eq("is_recurring", true),
      getCategoriesWithSubcategories(supabase, userId),
    ]);

  const actualDatesBySource = new Set<string>();
  for (const row of (incomeInMonth ?? []) as Income[]) {
    actualDatesBySource.add(`${row.source ?? "Income"}|${row.date}`);
  }

  const projected = projectRecurringIncome(
    (recurringIncome ?? []) as Income[],
    actualDatesBySource,
    rangeStart,
    rangeEnd
  );

  const days: CashFlowDay[] = Array.from({ length: numDays }, (_, i) => ({
    day: i + 1,
    date: `${start.slice(0, 8)}${String(i + 1).padStart(2, "0")}`,
    income: [],
    bills: [],
    runningBalance: startingBalance,
  }));

  for (const row of (incomeInMonth ?? []) as Income[]) {
    const day = Number(row.date.slice(8, 10));
    const bucket = days[day - 1];
    if (bucket) {
      bucket.income.push({
        amount: Number(row.amount),
        source: row.source ?? "Income",
        actual: true,
      });
    }
  }

  for (const p of projected) {
    const day = Number(p.date.slice(8, 10));
    const bucket = days[day - 1];
    if (bucket) {
      bucket.income.push({ amount: p.amount, source: p.source, actual: false });
    }
  }

  const unscheduled: UnscheduledBill[] = [];

  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      if (sub.type !== "fixed") continue;
      if (sub.due_day && sub.due_day <= numDays) {
        days[sub.due_day - 1].bills.push({
          subcategoryId: sub.id,
          name: sub.name,
          categoryName: cat.name,
          amount: Number(sub.planned_amount),
        });
      } else if (!sub.due_day && Number(sub.planned_amount) > 0) {
        unscheduled.push({
          subcategoryId: sub.id,
          name: sub.name,
          categoryName: cat.name,
          amount: Number(sub.planned_amount),
        });
      }
    }
  }

  // Running balance: starting balance, plus every income event, minus
  // every bill, walked forward day by day through the month.
  let runningBalance = startingBalance;
  for (const d of days) {
    for (const ev of d.income) runningBalance += ev.amount;
    for (const b of d.bills) runningBalance -= b.amount;
    d.runningBalance = runningBalance;
  }

  const weeks: CashFlowWeek[] = [];
  for (let startDay = 1; startDay <= numDays; startDay += 7) {
    const endDay = Math.min(startDay + 6, numDays);
    const weekDays = days.slice(startDay - 1, endDay);

    let incomeActual = 0;
    let incomeProjected = 0;
    const bills: (CashFlowBillEvent & { day: number })[] = [];

    for (const d of weekDays) {
      for (const ev of d.income) {
        if (ev.actual) incomeActual += ev.amount;
        else incomeProjected += ev.amount;
      }
      for (const b of d.bills) bills.push({ ...b, day: d.day });
    }

    const billsTotal = bills.reduce((s, b) => s + b.amount, 0);

    weeks.push({
      label: `${startDay}–${endDay}`,
      startDay,
      endDay,
      incomeActual,
      incomeProjected,
      bills,
      billsTotal,
      freeToSpend: incomeActual + incomeProjected - billsTotal,
    });
  }

  return { year, month, days, weeks, unscheduled };
}

export interface AccountBalance extends Account {
  currentBalance: number;
}

export interface AccountSummary {
  checking: AccountBalance[];
  savings: AccountBalance[];
  credit: AccountBalance[];
  investment: AccountBalance[];
  cash: AccountBalance[];
  totalChecking: number;
  totalSavings: number;
  totalCredit: number;
  totalInvestment: number;
  totalCash: number;
  netCash: number;
}

/**
 * Each account's `starting_balance` is a snapshot as of `balance_as_of`
 * (or all-time if that's null). This adds everything logged against the
 * account since then — for a Credit account that balance means "amount
 * owed", so a charge (expense) increases it instead of decreasing it.
 */
export async function getAccountSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<AccountSummary> {
  const [accounts, { data: incomeRows }, { data: expenseRows }, { data: debtPaymentRows }] =
    await Promise.all([
      getAccounts(supabase, userId),
      supabase.from("income").select("account_id, amount, date").eq("user_id", userId),
      supabase.from("expenses").select("account_id, amount, date").eq("user_id", userId),
      supabase
        .from("debt_payments")
        .select("account_id, amount, date")
        .eq("user_id", userId),
    ]);

  function netFlowFor(accountId: string, since: string | null) {
    const inRange = (date: string) => !since || date >= since;
    const sumFor = (rows: { account_id: string | null; amount: number; date: string }[] | null) =>
      (rows ?? [])
        .filter((r) => r.account_id === accountId && inRange(r.date))
        .reduce((s, r) => s + Number(r.amount), 0);

    return (
      sumFor(incomeRows) - sumFor(expenseRows) - sumFor(debtPaymentRows)
    );
  }

  const withBalance: AccountBalance[] = accounts.map((a) => {
    const netFlow = netFlowFor(a.id, a.balance_as_of);
    const currentBalance =
      a.account_type === "credit"
        ? Number(a.starting_balance) - netFlow
        : Number(a.starting_balance) + netFlow;
    return { ...a, currentBalance };
  });

  const byType = (type: AccountType) => withBalance.filter((a) => a.account_type === type);
  const sum = (list: AccountBalance[]) => list.reduce((s, a) => s + a.currentBalance, 0);

  const checking = byType("checking");
  const savings = byType("savings");
  const credit = byType("credit");
  const investment = byType("investment");
  const cash = byType("cash");

  const totalChecking = sum(checking);
  const totalSavings = sum(savings);
  const totalCredit = sum(credit);
  const totalInvestment = sum(investment);
  const totalCash = sum(cash);

  return {
    checking,
    savings,
    credit,
    investment,
    cash,
    totalChecking,
    totalSavings,
    totalCredit,
    totalInvestment,
    totalCash,
    netCash: totalChecking + totalSavings + totalCash - totalCredit,
  };
}

export async function getGoals(
  supabase: SupabaseClient,
  userId: string
): Promise<Goal[]> {
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  return data ?? [];
}

export interface GoalProgress {
  remaining: number;
  monthsLeft: number | null;
  monthlyContribution: number | null;
  pctSaved: number;
  onTrack: boolean;
}

/**
 * How much to put toward a goal each month to hit it by its target date.
 * No target date -> no monthly figure to compute, just track progress.
 */
export function computeGoalProgress(goal: Goal, from: Date = new Date()): GoalProgress {
  const remaining = Math.max(Number(goal.target_amount) - Number(goal.saved_so_far), 0);
  const pctSaved =
    Number(goal.target_amount) > 0
      ? Math.min(Number(goal.saved_so_far) / Number(goal.target_amount), 1)
      : 0;

  if (!goal.target_date) {
    return { remaining, monthsLeft: null, monthlyContribution: null, pctSaved, onTrack: true };
  }

  const target = new Date(`${goal.target_date}T00:00:00`);
  const monthsLeft = Math.max(
    (target.getFullYear() - from.getFullYear()) * 12 +
      (target.getMonth() - from.getMonth()) +
      (target.getDate() >= from.getDate() ? 0 : -1),
    0
  );
  const effectiveMonths = Math.max(monthsLeft, 1);
  const monthlyContribution = remaining / effectiveMonths;

  return {
    remaining,
    monthsLeft,
    monthlyContribution,
    pctSaved,
    onTrack: remaining === 0 || monthsLeft > 0,
  };
}

export const DEFAULT_NOTIFICATION_PREFS: Omit<
  NotificationPreferences,
  "user_id" | "updated_at"
> = {
  bill_reminders: true,
  next_income: true,
  daily_balance: false,
  category_limit: true,
  low_balance: true,
  goal_reached: true,
};

export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as NotificationPreferences;
  return { user_id: userId, updated_at: "", ...DEFAULT_NOTIFICATION_PREFS };
}
