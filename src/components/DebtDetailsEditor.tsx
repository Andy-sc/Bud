"use client";

import { useState, useTransition } from "react";
import { updateDebtDetails } from "@/lib/actions/debts";

export default function DebtDetailsEditor({
  debtId,
  owedTo,
  originalAmount,
  interestRate,
}: {
  debtId: string;
  owedTo: string | null;
  originalAmount: number;
  interestRate: number;
}) {
  const [editing, setEditing] = useState(false);
  const [owed, setOwed] = useState(owedTo ?? "");
  const [original, setOriginal] = useState(String(originalAmount));
  const [rate, setRate] = useState(String(interestRate));
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--series-1)]"
      >
        Edit details
      </button>
    );
  }

  return (
    <form
      className="grid grid-cols-3 gap-2 pt-1"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateDebtDetails(debtId, {
            owed_to: owed,
            original_amount: parseFloat(original) || 0,
            interest_rate: parseFloat(rate) || 0,
          });
          setEditing(false);
        });
      }}
    >
      <label className="text-xs text-[var(--text-muted)]">
        Owed to
        <input
          value={owed}
          onChange={(e) => setOwed(e.target.value)}
          className="control w-full mt-0.5 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
        />
      </label>
      <label className="text-xs text-[var(--text-muted)]">
        Original amount
        <input
          type="number"
          step="0.01"
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
          className="control w-full mt-0.5 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
        />
      </label>
      <label className="text-xs text-[var(--text-muted)]">
        Interest rate (%)
        <input
          type="number"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="control w-full mt-0.5 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
        />
      </label>
      <div className="col-span-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded-md bg-[var(--series-1)] text-white disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs px-3 py-1.5 text-[var(--text-secondary)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
