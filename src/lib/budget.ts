import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/date";
import type {
  Account,
  Category,
  Debt,
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
  month: number
): Promise<MonthBudget> {
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
          actual = fixedActualBySubcat.get(sub.id) ?? 0;
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

  const [{ data: incomeRows }, { data: expenseRows }, { data: debtRows }] =
    await Promise.all([
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
    ]);

  const incomeActual = (incomeRows ?? []).reduce(
    (s, r) => s + Number(r.amount),
    0
  );
  const expensesActual =
    (expenseRows ?? []).reduce((s, r) => s + Number(r.amount), 0) +
    (debtRows ?? []).reduce((s, r) => s + Number(r.actual_amount), 0);

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
}

export async function getDebtsWithBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<DebtComputed[]> {
  const [{ data: debts }, { data: payments }] = await Promise.all([
    supabase
      .from("debts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at"),
    supabase.from("debt_payments").select("debt_id, amount").eq("user_id", userId),
  ]);

  const paidByDebt = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByDebt.set(p.debt_id, (paidByDebt.get(p.debt_id) ?? 0) + Number(p.amount));
  }

  return (debts ?? []).map((d: Debt) => {
    const paidSoFar = paidByDebt.get(d.id) ?? 0;
    const original = Number(d.original_amount);
    return {
      ...d,
      paidSoFar,
      currentBalance: original - paidSoFar,
      pctPaid: original ? paidSoFar / original : 0,
    };
  });
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
    const key = row.account_id ?? "sin-cuenta";
    totals.set(key, (totals.get(key) ?? 0) + Number(row.amount));
  }

  return Array.from(totals.entries()).map(([key, amount]) => ({
    accountId: key === "sin-cuenta" ? null : key,
    accountName: key === "sin-cuenta" ? "Sin cuenta" : nameById.get(key) ?? "?",
    amount,
  }));
}
