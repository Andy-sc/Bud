"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addIncome(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const date = String(formData.get("date"));
  const amount = parseFloat(String(formData.get("amount")));
  const source = String(formData.get("source") || "") || null;
  const account_id = String(formData.get("account_id") || "") || null;
  const note = String(formData.get("note") || "") || null;

  if (!date || !amount) {
    throw new Error("Fecha y monto son obligatorios.");
  }

  const { error } = await supabase.from("income").insert({
    user_id: user.id,
    date,
    amount,
    source,
    account_id,
    note,
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
