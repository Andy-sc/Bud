"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/lib/format";

interface Datum {
  name: string;
  planned: number;
  actual: number;
  pctUsed: number;
}

function statusColor(pctUsed: number) {
  if (pctUsed > 1) return "var(--critical)";
  if (pctUsed >= 0.85) return "var(--warning)";
  return "var(--good)";
}

export default function PlannedVsActualChart({ data }: { data: Datum[] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--gridline)" }}
            tickLine={false}
            interval={0}
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
          <Bar dataKey="planned" name="Planned" fill="var(--planned-bar)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={statusColor(d.pctUsed)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 justify-center mt-2 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "var(--planned-bar)" }} />
          Planned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "var(--good)" }} />
          Actual (on track)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "var(--critical)" }} />
          Actual (over budget)
        </span>
      </div>
    </div>
  );
}
