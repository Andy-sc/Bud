"use client";

import { useState } from "react";
import CashFlowWeekList from "@/components/CashFlowWeekList";
import CashFlowCalendarGrid from "@/components/CashFlowCalendarGrid";
import type { MonthCashFlow } from "@/lib/budget";

export default function CashFlowSection({ data }: { data: MonthCashFlow }) {
  const [view, setView] = useState<"weeks" | "calendar">("weeks");

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--text-primary)]">Weekly cash flow</h3>
        <div className="flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-full p-1">
          {(["weeks", "calendar"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                view === v
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {v === "weeks" ? "Weeks" : "Calendar"}
            </button>
          ))}
        </div>
      </div>
      {view === "weeks" ? (
        <CashFlowWeekList data={data} />
      ) : (
        <CashFlowCalendarGrid data={data} />
      )}
    </div>
  );
}
