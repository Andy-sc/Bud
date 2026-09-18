import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Runs once a day (see vercel.json). Unlike the bill-reminders cron, this
// runs for EVERY user regardless of notification settings — it's not a
// notification, it's the actual "magic" behind recurring transfers
// (e.g. $25 Checking -> Savings every Monday): once a recurring
// transfer's next occurrence date arrives, this creates the real row so
// account balances update themselves without the user re-entering it.
// Uses the service role key (bypasses RLS) since this has no signed-in
// user — it needs to see every profile's transfers, not just one.

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addOneMonth(date: Date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const todayISO = toISODate(new Date());

  const { data: recurringTransfers, error } = await supabase
    .from("transfers")
    .select("*")
    .eq("is_recurring", true);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The most recent recurring row per (user, from, to) is the current
  // pattern — same "latest anchor" convention as recurring income.
  const latestByKey = new Map<string, (typeof recurringTransfers)[number]>();
  for (const t of recurringTransfers ?? []) {
    const key = `${t.user_id}|${t.from_account_id}|${t.to_account_id}`;
    const existing = latestByKey.get(key);
    if (!existing || t.date > existing.date) latestByKey.set(key, t);
  }

  let created = 0;

  for (const anchor of latestByKey.values()) {
    if (!anchor.recurrence_interval) continue;
    const step = (d: Date) =>
      anchor.recurrence_interval === "weekly"
        ? addDays(d, 7)
        : anchor.recurrence_interval === "biweekly"
          ? addDays(d, 14)
          : addOneMonth(d);

    // Catch up on every occurrence due since the anchor, not just "is one
    // due today" — a single missed cron run would otherwise leave the
    // pattern's anchor stuck in the past, permanently stopping it from
    // ever firing again. Capped defensively; a daily cron should never
    // actually need more than a couple of iterations here.
    let cursor = new Date(`${anchor.date}T00:00:00`);
    for (let i = 0; i < 60; i++) {
      cursor = step(cursor);
      const cursorISO = toISODate(cursor);
      if (cursorISO > todayISO) break;

      const { data: existingRow } = await supabase
        .from("transfers")
        .select("id")
        .eq("user_id", anchor.user_id)
        .eq("from_account_id", anchor.from_account_id)
        .eq("to_account_id", anchor.to_account_id)
        .eq("date", cursorISO)
        .maybeSingle();
      if (existingRow) continue;

      const { error: insertError } = await supabase.from("transfers").insert({
        user_id: anchor.user_id,
        from_account_id: anchor.from_account_id,
        to_account_id: anchor.to_account_id,
        amount: anchor.amount,
        date: cursorISO,
        note: anchor.note,
        is_recurring: true,
        recurrence_interval: anchor.recurrence_interval,
      });
      if (!insertError) created++;
    }
  }

  return NextResponse.json({ created });
}
