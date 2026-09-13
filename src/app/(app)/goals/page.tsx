import { createClient } from "@/lib/supabase/server";
import { getGoals } from "@/lib/budget";
import GoalForm from "@/components/GoalForm";
import GoalCard from "@/components/GoalCard";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const goals = await getGoals(supabase, userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Goals</h1>
        <GoalForm />
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          You don&apos;t have any savings goals yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}
    </div>
  );
}
