"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function updateProfileName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name can't be empty.");

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("profiles").update({ name: trimmed }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/login");
}

export async function updateProfilePin(newPin: string) {
  if (!/^\d{6}$/.test(newPin)) {
    throw new Error("PIN must be 6 digits.");
  }

  const { supabase } = await currentUserId();
  const { error } = await supabase.auth.updateUser({ password: newPin });
  if (error) throw new Error(error.message);
}
