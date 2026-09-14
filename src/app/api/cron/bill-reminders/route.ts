import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs once a day (see vercel.json) and pushes a reminder for every Fixed
// bill due tomorrow, to every device that's enabled notifications. Uses
// the service role key (bypasses RLS) since this has no signed-in user —
// it needs to see every profile's bills, not just one.

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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueDay = tomorrow.getDate();

  const { data: bills, error: billsError } = await supabase
    .from("subcategories")
    .select("id, user_id, name, planned_amount, category_id, categories(name)")
    .eq("type", "fixed")
    .eq("due_day", dueDay);

  if (billsError) {
    return NextResponse.json({ error: billsError.message }, { status: 500 });
  }
  if (!bills || bills.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no bills due tomorrow" });
  }

  const userIds = [...new Set(bills.map((b) => b.user_id))];
  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  const subsByUser = new Map<string, typeof subs>();
  for (const s of subs ?? []) {
    const list = subsByUser.get(s.user_id) ?? [];
    list.push(s);
    subsByUser.set(s.user_id, list);
  }

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const bill of bills) {
    const userSubs = subsByUser.get(bill.user_id) ?? [];
    if (userSubs.length === 0) continue;

    const payload = JSON.stringify({
      title: "Bill due tomorrow",
      body: `${bill.name} — $${Number(bill.planned_amount).toFixed(2)}`,
      url: "/calendar",
    });

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
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

  return NextResponse.json({ sent, billsDueTomorrow: bills.length });
}
