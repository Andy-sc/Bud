"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setFixedActual(
  subcategoryId: string,
  year: number,
  month: number,
  amount: number,
  accountId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("fixed_actuals").upsert(
    {
      user_id: user.id,
      subcategory_id: subcategoryId,
      year,
      month,
      actual_amount: amount,
      account_id: accountId,
    },
    { onConflict: "subcategory_id,year,month" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function setMonthlyOverride(
  subcategoryId: string,
  year: number,
  month: number,
  plannedAmount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("monthly_overrides").upsert(
    {
      user_id: user.id,
      subcategory_id: subcategoryId,
      year,
      month,
      planned_amount: plannedAmount,
    },
    { onConflict: "subcategory_id,year,month" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function setIncomePlan(year: number, month: number, amount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("income_plan").upsert(
    { user_id: user.id, year, month, planned_amount: amount },
    { onConflict: "user_id,year,month" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
