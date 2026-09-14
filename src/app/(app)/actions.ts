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

  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, onboarded: true }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect("/settings");
}
