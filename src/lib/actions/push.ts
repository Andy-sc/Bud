"use server";

import { createClient } from "@/lib/supabase/server";
import type { NotificationPreferences } from "@/lib/database.types";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw new Error(error.message);
}

export async function deletePushSubscription(endpoint: string) {
  const { supabase } = await currentUserId();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}

export async function hasPushSubscription(endpoint: string) {
  const { supabase, userId } = await currentUserId();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .maybeSingle();
  return !!data;
}

export async function updateNotificationPreferences(
  prefs: Partial<Omit<NotificationPreferences, "user_id" | "updated_at">>
) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("notification_preferences").upsert(
    { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
}
