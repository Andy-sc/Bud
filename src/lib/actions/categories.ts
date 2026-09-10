"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SubcategoryType } from "@/lib/database.types";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function addCategory(name: string) {
  const { supabase, userId } = await currentUserId();
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const { error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name, sort_order: count ?? 0 });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function renameCategory(id: string, name: string) {
  const { supabase } = await currentUserId();
  const { error } = await supabase.from("categories").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function deleteCategory(id: string) {
  const { supabase } = await currentUserId();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    throw new Error(
      "Can't delete: remove or move its subcategories first."
    );
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function addSubcategory(
  categoryId: string,
  name: string,
  type: SubcategoryType,
  plannedAmount: number
) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("subcategories").insert({
    user_id: userId,
    category_id: categoryId,
    name,
    type,
    planned_amount: plannedAmount,
    sort_order: 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateSubcategory(
  id: string,
  name: string,
  plannedAmount: number
) {
  const { supabase } = await currentUserId();
  const { error } = await supabase
    .from("subcategories")
    .update({ name, planned_amount: plannedAmount })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function deleteSubcategory(id: string) {
  const { supabase } = await currentUserId();
  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) {
    throw new Error(
      "Can't delete: it already has expenses logged in your history."
    );
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function addAccount(name: string) {
  const { supabase, userId } = await currentUserId();
  const { count } = await supabase
    .from("accounts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const { error } = await supabase
    .from("accounts")
    .insert({ user_id: userId, name, sort_order: count ?? 0 });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function renameAccount(id: string, name: string) {
  const { supabase } = await currentUserId();
  const { error } = await supabase.from("accounts").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function deleteAccount(id: string) {
  const { supabase } = await currentUserId();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) {
    throw new Error("Can't delete: it already has logged transactions.");
  }
  revalidatePath("/settings");
}
