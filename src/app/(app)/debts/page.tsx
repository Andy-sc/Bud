import { createClient } from "@/lib/supabase/server";
import { getAccounts, getDebtsWithBalance } from "@/lib/budget";
import AddDebtForm from "@/components/AddDebtForm";
import DebtCard from "@/components/DebtCard";

export default async function DebtsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [debts, accounts] = await Promise.all([
    getDebtsWithBalance(supabase, userId),
    getAccounts(supabase, userId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Deudas</h1>
        <AddDebtForm />
      </div>

      {debts.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No tienes deudas registradas.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {debts.map((d) => (
            <DebtCard key={d.id} debt={d} accounts={accounts} />
          ))}
        </div>
      )}
    </div>
  );
}
