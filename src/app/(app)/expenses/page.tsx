import { createClient } from "@/lib/supabase/server";
import { getAccounts, getCategoriesWithSubcategories } from "@/lib/budget";
import { deleteExpense } from "@/lib/actions/expenses";
import ExpenseForm from "@/components/ExpenseForm";
import { money } from "@/lib/format";
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

  const subcatById = new Map<string, string>();
  for (const c of categories) {
    for (const s of c.subcategories) subcatById.set(s.id, `${c.name} · ${s.name}`);
  }
  const accountById = new Map(accounts.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Registrar gasto
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="card p-5">
          <ExpenseForm categories={categories} accounts={accounts} />
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-[var(--text-primary)] mb-3">
            Últimos gastos
          </h2>
          <div className="divide-y divide-[var(--border)]">
            {(expenses as Expense[] | null)?.length ? (
              (expenses as Expense[]).map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {subcatById.get(e.subcategory_id) ?? "—"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {e.date} · {e.account_id ? accountById.get(e.account_id) : "sin cuenta"}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium tabular-nums text-[var(--series-8)]">
                      {money(Number(e.amount))}
                    </span>
                    <form action={deleteExpense.bind(null, e.id)}>
                      <button
                        type="submit"
                        className="text-[var(--text-muted)] hover:text-[var(--critical)] text-sm"
                        aria-label="Eliminar"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-4">
                Aún no has registrado gastos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
