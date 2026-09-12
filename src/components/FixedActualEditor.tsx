"use client";

import { useState, useTransition } from "react";
import { setFixedActual } from "@/lib/actions/fixedActuals";
import { money } from "@/lib/format";

export default function FixedActualEditor({
  subcategoryId,
  year,
  month,
  actual,
}: {
  subcategoryId: string;
  year: number;
  month: number;
  actual: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(actual || ""));
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm tabular-nums text-[var(--text-secondary)] hover:text-[var(--accent)] underline decoration-dotted underline-offset-2"
        title="Edit actual amount"
      >
        {money(actual)}
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const amount = parseFloat(value) || 0;
        startTransition(async () => {
          await setFixedActual(subcategoryId, year, month, amount, null);
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
        className="control w-24 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs px-2 py-1 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-60"
        onMouseDown={(e) => e.preventDefault()}
      >
        OK
      </button>
    </form>
  );
}
