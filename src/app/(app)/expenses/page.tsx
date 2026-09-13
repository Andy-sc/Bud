import { createClient } from "@/lib/supabase/server";
import { getAccounts, getCategoriesWithSubcategories } from "@/lib/budget";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseHistoryList from "@/components/ExpenseHistoryList";
import type { Expense } from "@/lib/database.types";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [categories, accounts, { data: expenses }] = await Promise.all([
    getCategoriesWithSubcategories(supabase, userId),
    getAccounts(supabase, userId),
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Log expense
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="card p-5">
          <ExpenseForm categories={categories} accounts={accounts} />
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-[var(--text-primary)] mb-3">
            Recent expenses
          </h2>
          <ExpenseHistoryList
            expenses={(expenses as Expense[]) ?? []}
            categories={categories}
            accounts={accounts}
          />
        </div>
      </div>
    </div>
  );
}
