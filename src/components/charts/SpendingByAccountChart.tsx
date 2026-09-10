"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";

const ACCOUNT_ORDER = ["Chase Checking", "Chase Savings", "Chase Credit", "Vanguard", "Venmo"];
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

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
        Aún no hay gastos registrados este mes.
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
          <XAxis type="number" tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="accountName"
            tick={{ fontSize: 12, fill: "#52514e" }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            cursor={{ fill: "rgba(11,11,11,0.04)" }}
            formatter={(value) => money(Number(value))}
            contentStyle={{ borderRadius: 10, border: "1px solid #e1e0d9", fontSize: 12 }}
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
