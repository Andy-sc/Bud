"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addIncome(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const date = String(formData.get("date"));
  const amount = parseFloat(String(formData.get("amount")));
  const source = String(formData.get("source") || "") || null;
  const account_id = String(formData.get("account_id") || "") || null;
  const note = String(formData.get("note") || "") || null;
  const is_recurring = formData.get("is_recurring") === "on";
  const recurrence_interval = is_recurring
    ? String(formData.get("recurrence_interval") || "") || null
    : null;

  if (!date || !amount) {
    throw new Error("Date and amount are required.");
  }

  const { error } = await supabase.from("income").insert({
    user_id: user.id,
    date,
    amount,
    source,
    account_id,
    note,
    is_recurring,
    recurrence_interval,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("income").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/income");
  revalidatePath("/dashboard");
}
