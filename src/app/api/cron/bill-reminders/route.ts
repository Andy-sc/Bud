import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import {
  getAccountSummary,
  getMonthBudget,
  getGoals,
  projectRecurringIncome,
  DEFAULT_NOTIFICATION_PREFS,
} from "@/lib/budget";
import type { Income, NotificationPreferences } from "@/lib/database.types";

// Runs once a day (see vercel.json). For every profile with at least one
// push subscription, checks each notification type it has turned on
// (Settings -> Notifications) and sends whatever applies today. Uses the
// service role key (bypasses RLS) since this has no signed-in user — it
// needs to see every profile's data, not just one.

interface PushRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface Notification {
  userId: string;
  title: string;
  body: string;
  url: string;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!vapidPublicKey || !vapidPrivateKey || !serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Notifications aren't fully configured (missing env vars)." },
      { status: 500 }
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_CONTACT ?? "mailto:noreply@example.com",
    vapidPublicKey,
    vapidPrivateKey
  );

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: profiles } = await supabase.from("profiles").select("id");
  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no profiles" });
  }

  const { data: allSubs } = await supabase.from("push_subscriptions").select("*");
  const subsByUser = new Map<string, PushRow[]>();
  for (const s of (allSubs ?? []) as PushRow[]) {
    const list = subsByUser.get(s.user_id) ?? [];
    list.push(s);
    subsByUser.set(s.user_id, list);
  }

  const { data: prefRows } = await supabase.from("notification_preferences").select("*");
  const prefsByUser = new Map<string, NotificationPreferences>();
  for (const p of (prefRows ?? []) as NotificationPreferences[]) {
    prefsByUser.set(p.user_id, p);
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);
  const dueDay = tomorrow.getDate();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const notifications: Notification[] = [];

  for (const profile of profiles) {
    const userId = profile.id as string;
    const userSubs = subsByUser.get(userId) ?? [];
    if (userSubs.length === 0) continue;

    const prefs: NotificationPreferences =
      prefsByUser.get(userId) ?? {
        user_id: userId,
        updated_at: "",
        ...DEFAULT_NOTIFICATION_PREFS,
      };

    // Bills due tomorrow
    if (prefs.bill_reminders) {
      const { data: bills } = await supabase
        .from("subcategories")
        .select("name, planned_amount, categories(name)")
        .eq("user_id", userId)
        .eq("type", "fixed")
        .eq("due_day", dueDay);
      for (const bill of bills ?? []) {
        notifications.push({
          userId,
          title: "Bill due tomorrow",
          body: `${bill.name} — $${Number(bill.planned_amount).toFixed(2)}`,
          url: "/calendar",
        });
      }
    }

    // Recurring income expected tomorrow
    if (prefs.next_income) {
      const { data: recurringIncome } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", userId)
        .eq("is_recurring", true);
      const { data: actualTomorrow } = await supabase
        .from("income")
        .select("source, date")
        .eq("user_id", userId)
        .eq("date", tomorrowISO);
      const actualSet = new Set(
        (actualTomorrow ?? []).map((r) => `${r.source ?? "Income"}|${r.date}`)
      );
      const rangeStart = new Date(`${tomorrowISO}T00:00:00`);
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + 1);
      const projected = projectRecurringIncome(
        (recurringIncome ?? []) as Income[],
        actualSet,
        rangeStart,
        rangeEnd
      );
      for (const p of projected) {
        notifications.push({
          userId,
          title: "Income expected tomorrow",
          body: `${p.source} — $${p.amount.toFixed(2)}`,
          url: "/calendar",
        });
      }
    }

    // Daily balance summary + low balance warning share one account fetch
    if (prefs.daily_balance || prefs.low_balance) {
      const summary = await getAccountSummary(supabase, userId);
      if (prefs.daily_balance) {
        notifications.push({
          userId,
          title: "Daily balance",
          body: `Balance across accounts: $${summary.netCash.toFixed(2)}`,
          url: "/dashboard",
        });
      }
      if (prefs.low_balance && summary.netCash < 0) {
        notifications.push({
          userId,
          title: "Low balance warning",
          body: `Your balance across accounts is negative: $${summary.netCash.toFixed(2)}`,
          url: "/dashboard",
        });
      }
    }

    // Category at/near 80% of its planned amount — once per subcategory per month
    if (prefs.category_limit) {
      const budget = await getMonthBudget(supabase, userId, year, month);
      for (const cat of budget.categories) {
        for (const sub of cat.subcategories) {
          if (sub.type === "debt" || sub.planned <= 0 || sub.pctUsed < 0.8) continue;
          const { data: existing } = await supabase
            .from("category_limit_alerts")
            .select("id")
            .eq("subcategory_id", sub.id)
            .eq("year", year)
            .eq("month", month)
            .maybeSingle();
          if (existing) continue;
          notifications.push({
            userId,
            title: "Category near its limit",
            body: `${cat.name} → ${sub.name} is at ${Math.round(sub.pctUsed * 100)}% of its budget`,
            url: "/dashboard",
          });
          await supabase
            .from("category_limit_alerts")
            .insert({ user_id: userId, subcategory_id: sub.id, year, month });
        }
      }
    }

    // Goal fully funded — fires once, resets if saved dips back under target
    if (prefs.goal_reached) {
      const goals = await getGoals(supabase, userId);
      for (const g of goals) {
        const reached = Number(g.saved_so_far) >= Number(g.target_amount);
        if (reached && !g.notified_reached) {
          notifications.push({
            userId,
            title: "Goal reached",
            body: `You hit your goal: ${g.name}`,
            url: "/goals",
          });
          await supabase.from("goals").update({ notified_reached: true }).eq("id", g.id);
        } else if (!reached && g.notified_reached) {
          await supabase.from("goals").update({ notified_reached: false }).eq("id", g.id);
        }
      }
    }
  }

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const n of notifications) {
    const userSubs = subsByUser.get(n.userId) ?? [];
    const payload = JSON.stringify({ title: n.title, body: n.body, url: n.url });
    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return NextResponse.json({ sent, notifications: notifications.length });
}
