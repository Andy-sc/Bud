import { createClient } from "@/lib/supabase/server";
import { getAccounts, getCategoriesWithSubcategories } from "@/lib/budget";

function csvField(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function monthStart(ym: string) {
  return `${ym}-01`;
}

function monthEndExclusive(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const nextYear = m === 12 ? y + 1 : y;
  const nextMonth = m === 12 ? 1 : m + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

interface Row {
  date: string;
  type: string;
  category: string;
  account: string;
  note: string;
  amount: number;
}

// Exports every expense and income row in [from, to] (inclusive, YYYY-MM
// query params) as CSV — Trends -> "Download CSV".
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const userId = user.id;

  const { searchParams } = new URL(request.url);
  const fromYm = searchParams.get("from");
  const toYm = searchParams.get("to");
  if (!fromYm || !toYm || !/^\d{4}-\d{2}$/.test(fromYm) || !/^\d{4}-\d{2}$/.test(toYm)) {
    return new Response("Invalid from/to — expected YYYY-MM.", { status: 400 });
  }

  const start = monthStart(fromYm);
  const end = monthEndExclusive(toYm);

  const [categories, accounts, { data: expenses }, { data: income }] = await Promise.all([
    getCategoriesWithSubcategories(supabase, userId),
    getAccounts(supabase, userId),
    supabase
      .from("expenses")
      .select("date, amount, subcategory_id, account_id, note")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end),
    supabase
      .from("income")
      .select("date, amount, source, account_id, note")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end),
  ]);

  const subcatById = new Map<string, string>();
  for (const c of categories) {
    for (const s of c.subcategories) subcatById.set(s.id, `${c.name} > ${s.name}`);
  }
  const accountById = new Map(accounts.map((a) => [a.id, a.name]));

  const rows: Row[] = [];

  for (const e of expenses ?? []) {
    rows.push({
      date: e.date,
      type: "Expense",
      category: subcatById.get(e.subcategory_id) ?? "",
      account: e.account_id ? accountById.get(e.account_id) ?? "" : "",
      note: e.note ?? "",
      amount: Number(e.amount),
    });
  }
  for (const i of income ?? []) {
    rows.push({
      date: i.date,
      type: "Income",
      category: i.source ?? "",
      account: i.account_id ? accountById.get(i.account_id) ?? "" : "",
      note: i.note ?? "",
      amount: Number(i.amount),
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  const header = ["Date", "Type", "Category / Source", "Account", "Note", "Amount"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.date, r.type, r.category, r.account, r.note, r.amount.toFixed(2)]
        .map((v) => csvField(String(v)))
        .join(",")
    );
  }

  const csv = lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bud-export-${fromYm}-to-${toYm}.csv"`,
    },
  });
}
