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

function statusHex(pctUsed: number) {
  if (pctUsed > 1) return "#d03b3b";
  if (pctUsed >= 0.85) return "#fab219";
  return "#0ca30c";
}

export default function PlannedVsActualChart({ data }: { data: Datum[] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={{ stroke: "#e1e0d9" }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "rgba(11,11,11,0.04)" }}
            formatter={(value) => money(Number(value))}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e1e0d9",
              fontSize: 12,
            }}
          />
          <Bar dataKey="planned" name="Planned" fill="#c3c2b7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={statusHex(d.pctUsed)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 justify-center mt-2 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#c3c2b7" }} />
          Planned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#0ca30c" }} />
          Actual (on track)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#d03b3b" }} />
          Actual (over budget)
        </span>
      </div>
    </div>
  );
}
