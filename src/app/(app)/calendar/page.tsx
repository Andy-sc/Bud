import { createClient } from "@/lib/supabase/server";
import { getMonthCashFlow } from "@/lib/budget";
import { currentYearMonth } from "@/lib/date";
import MonthNav from "@/components/MonthNav";
import CashFlowSection from "@/components/CashFlowSection";

export default async function CalendarPage({
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

  const cashFlow = await getMonthCashFlow(supabase, userId, year, month);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Calendar</h1>

      <div className="card p-4 md:p-5">
        <MonthNav year={year} month={month} basePath="/calendar" />
      </div>

      <CashFlowSection data={cashFlow} />
    </div>
  );
}
