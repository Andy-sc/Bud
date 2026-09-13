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

export async function addGoal(
  name: string,
  targetAmount: number,
  targetDate: string | null,
  savedSoFar: number
) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("goals").insert({
    user_id: userId,
    name,
    target_amount: targetAmount,
    target_date: targetDate,
    saved_so_far: savedSoFar,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}

export async function updateGoalSaved(id: string, savedSoFar: number) {
  const { supabase } = await currentUserId();
  const { error } = await supabase
    .from("goals")
    .update({ saved_so_far: savedSoFar })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  const { supabase } = await currentUserId();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}
