"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/lib/format";
import type { MonthlyTrendPoint } from "@/lib/budget";

export default function MonthlyTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--gridline)" }}
            tickLine={false}
            interval={data.length > 12 ? Math.ceil(data.length / 12) : 0}
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value) => money(Number(value))}
            contentStyle={{
              background: "var(--surface)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text-primary)",
            }}
          />
          <Line
            type="monotone"
            dataKey="incomeActual"
            name="Income"
            stroke="var(--good)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expensesActual"
            name="Expenses"
            stroke="var(--critical)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 justify-center mt-2 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "var(--good)" }} />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "var(--critical)" }} />
          Expenses
        </span>
      </div>
    </div>
  );
}
