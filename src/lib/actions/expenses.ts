"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const date = String(formData.get("date"));
  const amount = parseFloat(String(formData.get("amount")));
  const subcategory_id = String(formData.get("subcategory_id"));
  const account_id = String(formData.get("account_id") || "") || null;
  const note = String(formData.get("note") || "") || null;

  if (!date || !amount || !subcategory_id) {
    throw new Error("Date, amount, and subcategory are required.");
  }

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    date,
    amount,
    subcategory_id,
    account_id,
    note,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateExpense(id: string, formData: FormData) {
  const supabase = await createClient();

  const date = String(formData.get("date"));
  const amount = parseFloat(String(formData.get("amount")));
  const subcategory_id = String(formData.get("subcategory_id"));
  const account_id = String(formData.get("account_id") || "") || null;
  const note = String(formData.get("note") || "") || null;

  if (!date || !amount || !subcategory_id) {
    throw new Error("Date, amount, and subcategory are required.");
  }

  const { error } = await supabase
    .from("expenses")
    .update({ date, amount, subcategory_id, account_id, note })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
