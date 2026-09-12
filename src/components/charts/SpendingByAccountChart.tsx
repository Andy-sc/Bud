"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";

const ACCOUNT_ORDER = ["Chase Checking", "Chase Savings", "Chase Credit", "Vanguard", "Venmo"];
const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

function colorFor(name: string) {
  const idx = ACCOUNT_ORDER.indexOf(name);
  if (idx !== -1) return SERIES[idx];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SERIES[h % SERIES.length];
}

export default function SpendingByAccountChart({
  data,
}: {
  data: { accountName: string; amount: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-10 text-center">
        No expenses logged yet this month.
      </p>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="accountName"
            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--text-primary) 6%, transparent)" }}
            formatter={(value) => money(Number(value))}
            contentStyle={{
              background: "var(--surface)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text-primary)",
            }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorFor(d.accountName)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
