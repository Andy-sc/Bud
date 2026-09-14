"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function seedStarterBudget() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("seed_starter_budget");
  if (error) throw new Error(error.message);

  await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, onboarded: true }, { onConflict: "user_id" });

  revalidatePath("/", "layout");
}

export async function skipOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Ignored on purpose (not awaited-and-thrown): if the `onboarded`
  // column isn't there yet (schema.sql hasn't been re-run), this is a
  // no-op and the layout falls back to its old categories-based check.
  await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, onboarded: true }, { onConflict: "user_id" });

  revalidatePath("/", "layout");
  redirect("/settings");
}
