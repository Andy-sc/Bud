"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addDebt(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const name = String(formData.get("name") || "").trim();
  const owed_to = String(formData.get("owed_to") || "") || null;
  const original_amount = parseFloat(String(formData.get("original_amount"))) || 0;
  const interest_rate = parseFloat(String(formData.get("interest_rate"))) || 0;
  const start_date = String(formData.get("start_date") || "") || null;
  const monthly_payment = parseFloat(String(formData.get("monthly_payment"))) || 0;

  if (!name || !original_amount) {
    throw new Error("Nombre y monto original son obligatorios.");
  }

  const { data: debt, error } = await supabase
    .from("debts")
    .insert({ user_id: user.id, name, owed_to, original_amount, interest_rate, start_date })
    .select()
    .single();
  if (error) throw new Error(error.message);

  let { data: debtCategory } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_debt", true)
    .maybeSingle();

  if (!debtCategory) {
    const { data: created, error: catError } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name: "Debt", is_debt: true, sort_order: 100 })
      .select()
      .single();
    if (catError) throw new Error(catError.message);
    debtCategory = created;
  }

  const { error: subError } = await supabase.from("subcategories").insert({
    user_id: user.id,
    category_id: debtCategory!.id,
    name,
    type: "debt",
    planned_amount: monthly_payment,
    debt_id: debt.id,
    sort_order: 0,
  });
  if (subError) throw new Error(subError.message);

  revalidatePath("/debts");
  revalidatePath("/dashboard");
}

export async function addDebtPayment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const debt_id = String(formData.get("debt_id"));
  const date = String(formData.get("date"));
  const amount = parseFloat(String(formData.get("amount")));
  const account_id = String(formData.get("account_id") || "") || null;
  const note = String(formData.get("note") || "") || null;

  if (!debt_id || !date || !amount) {
    throw new Error("Deuda, fecha y monto son obligatorios.");
  }

  const { error } = await supabase.from("debt_payments").insert({
    user_id: user.id,
    debt_id,
    date,
    amount,
    account_id,
    note,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/debts");
  revalidatePath("/dashboard");
}

export async function deleteDebtPayment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("debt_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/debts");
  revalidatePath("/dashboard");
}
