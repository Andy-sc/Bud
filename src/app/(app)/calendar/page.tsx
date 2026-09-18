import { createClient } from "@/lib/supabase/server";
import { getAccountSummary, getMonthCashFlow } from "@/lib/budget";
import { currentYearMonth } from "@/lib/date";
import ActivityTabs from "@/components/ActivityTabs";
import MonthNav from "@/components/MonthNav";
import CashFlowSection from "@/components/CashFlowSection";
import UnscheduledBills from "@/components/UnscheduledBills";

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

  const accountSummary = await getAccountSummary(supabase, userId);
  // Liquid cash only (not netCash) — netCash already subtracts what's owed
  // on credit cards, and the calendar separately shows paying off a card
  // as a future bill event. Starting from netCash would subtract that
  // same debt twice: once up front, again the day the card bill lands.
  const spendableCash =
    accountSummary.totalChecking + accountSummary.totalSavings + accountSummary.totalCash;
  const cashFlow = await getMonthCashFlow(supabase, userId, year, month, spendableCash);

  return (
    <div className="space-y-6">
      <ActivityTabs active="calendar" />
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Calendar</h1>

      <div className="card p-4 md:p-5">
        <MonthNav year={year} month={month} basePath="/calendar" />
      </div>

      <UnscheduledBills bills={cashFlow.unscheduled} />

      <CashFlowSection data={cashFlow} />
    </div>
  );
}
