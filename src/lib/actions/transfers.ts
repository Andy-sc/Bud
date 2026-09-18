"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateAll() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function addTransfer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const date = String(formData.get("date"));
  const amount = parseFloat(String(formData.get("amount")));
  const from_account_id = String(formData.get("from_account_id") || "");
  const to_account_id = String(formData.get("to_account_id") || "");
  const note = String(formData.get("note") || "") || null;
  const is_recurring = formData.get("is_recurring") === "on";
  const recurrence_interval = is_recurring
    ? String(formData.get("recurrence_interval") || "") || null
    : null;

  if (!date || !amount || !from_account_id || !to_account_id) {
    throw new Error("Date, amount, and both accounts are required.");
  }
  if (from_account_id === to_account_id) {
    throw new Error("Pick two different accounts.");
  }

  const { error } = await supabase.from("transfers").insert({
    user_id: user.id,
    date,
    amount,
    from_account_id,
    to_account_id,
    note,
    is_recurring,
    recurrence_interval,
  });
  if (error) throw new Error(error.message);

  revalidateAll();
}

export async function updateTransfer(id: string, formData: FormData) {
  const supabase = await createClient();

  const date = String(formData.get("date"));
  const amount = parseFloat(String(formData.get("amount")));
  const from_account_id = String(formData.get("from_account_id") || "");
  const to_account_id = String(formData.get("to_account_id") || "");
  const note = String(formData.get("note") || "") || null;
  const is_recurring = formData.get("is_recurring") === "on";
  const recurrence_interval = is_recurring
    ? String(formData.get("recurrence_interval") || "") || null
    : null;

  if (!date || !amount || !from_account_id || !to_account_id) {
    throw new Error("Date, amount, and both accounts are required.");
  }
  if (from_account_id === to_account_id) {
    throw new Error("Pick two different accounts.");
  }

  const { error } = await supabase
    .from("transfers")
    .update({
      date,
      amount,
      from_account_id,
      to_account_id,
      note,
      is_recurring,
      recurrence_interval,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateAll();
}

export async function deleteTransfer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transfers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAll();
}
