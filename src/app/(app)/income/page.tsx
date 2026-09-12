import { createClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/budget";
import { deleteIncome } from "@/lib/actions/income";
import IncomeForm from "@/components/IncomeForm";
import { money } from "@/lib/format";
import type { Income } from "@/lib/database.types";
import { CloseIcon } from "@/components/icons";

export default async function IncomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [accounts, { data: income }] = await Promise.all([
    getAccounts(supabase, userId),
    supabase
      .from("income")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50),
  ]);

  const accountById = new Map(accounts.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Log income
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="card p-5">
          <IncomeForm accounts={accounts} />
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-[var(--text-primary)] mb-3">
            Recent income
          </h2>
          <div className="divide-y divide-[var(--border)]">
            {(income as Income[] | null)?.length ? (
              (income as Income[]).map((i) => (
                <div key={i.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {i.source || "Income"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {i.date} · {i.account_id ? accountById.get(i.account_id) : "no account"}
                      {i.note ? ` · ${i.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium tabular-nums text-[var(--good)]">
                      {money(Number(i.amount))}
                    </span>
                    <form action={deleteIncome.bind(null, i.id)}>
                      <button
                        type="submit"
                        className="text-[var(--text-muted)] hover:text-[var(--critical)] text-sm"
                        aria-label="Delete"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-4">
                You haven&apos;t logged any income yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
