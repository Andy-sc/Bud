"use client";

import { useState, useTransition } from "react";
import ProgressBar from "@/components/ProgressBar";
import { setIncomePlan } from "@/lib/actions/fixedActuals";
import { money } from "@/lib/format";

export default function IncomeCard({
  year,
  month,
  planned,
  actual,
}: {
  year: number;
  month: number;
  planned: number;
  actual: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(planned || ""));
  const [pending, startTransition] = useTransition();
  const pctUsed = planned ? actual / planned : actual > 0 ? 1 : 0;

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--text-primary)]">Income</h3>
        {editing ? (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              const amount = parseFloat(value) || 0;
              startTransition(async () => {
                await setIncomePlan(year, month, amount);
                setEditing(false);
              });
            }}
          >
            <input
              autoFocus
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setEditing(false)}
              className="control w-24 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
            />
            <button
              type="submit"
              disabled={pending}
              onMouseDown={(e) => e.preventDefault()}
              className="text-xs px-2 py-1 rounded-md bg-[var(--series-1)] text-white disabled:opacity-60"
            >
              OK
            </button>
          </form>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--series-1)] underline decoration-dotted underline-offset-2"
          >
            editar meta: {money(planned)}
          </button>
        )}
      </div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-lg font-semibold tabular-nums text-[var(--series-6)]">
          {money(actual)}
        </span>
        <span className="tabular-nums text-[var(--text-muted)]">
          meta {money(planned)}
        </span>
      </div>
      <ProgressBar pctUsed={pctUsed} />
    </div>
  );
}
