"use client";

import { useState, useTransition } from "react";
import { updatePlannedAmount } from "@/lib/actions/categories";
import { money } from "@/lib/format";

export default function PlannedAmountEditor({
  subcategoryId,
  planned,
}: {
  subcategoryId: string;
  planned: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(planned || ""));
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[var(--text-muted)] hover:text-[var(--accent)] underline decoration-dotted underline-offset-2"
        title="Edit planned amount"
      >
        plan {money(planned)}
      </button>
    );
  }

  return (
    <form
      className="inline-flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const amount = parseFloat(value) || 0;
        startTransition(async () => {
          await updatePlannedAmount(subcategoryId, amount);
          setEditing(false);
        });
      }}
    >
      <input
        autoFocus
        type="number"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setEditing(false)}
        className="control w-20 px-1.5 py-0.5 text-xs border border-[var(--border)] bg-[var(--surface)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-60"
        onMouseDown={(e) => e.preventDefault()}
      >
        OK
      </button>
    </form>
  );
}
