"use client";

import { useState, useTransition } from "react";
import { addDebtPayment } from "@/lib/actions/debts";
import type { Account } from "@/lib/database.types";

export default function DebtPaymentForm({
  debtId,
  accounts,
}: {
  debtId: string;
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[var(--accent)] hover:underline"
      >
        Log a payment
      </button>
    );
  }

  return (
    <form
      key={formKey}
      className="mt-3 space-y-2 border-t border-[var(--border)] pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("debt_id", debtId);
        setError(null);
        startTransition(async () => {
          try {
            await addDebtPayment(formData);
            setFormKey((k) => k + 1);
            setOpen(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          name="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="control px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
        <input
          type="number"
          step="0.01"
          name="amount"
          required
          placeholder="Amount"
          className="control px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </div>
      <select
        name="account_id"
        className="control w-full px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
      >
        <option value="">Unspecified</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="note"
        placeholder="Note (optional)"
        className="control w-full px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
      />
      {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="control px-3 py-1.5 text-xs font-medium text-[var(--accent-ink)] bg-[var(--good)] disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save payment"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="control px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
