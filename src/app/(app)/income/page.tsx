import { createClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/budget";
import ActivityTabs from "@/components/ActivityTabs";
import IncomeForm from "@/components/IncomeForm";
import IncomeHistoryList from "@/components/IncomeHistoryList";
import type { Income } from "@/lib/database.types";

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

  return (
    <div className="space-y-6">
      <ActivityTabs active="income" />
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
          <IncomeHistoryList income={(income as Income[]) ?? []} accounts={accounts} />
        </div>
      </div>
    </div>
  );
}
