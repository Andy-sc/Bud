"use client";

import { useState, useTransition } from "react";
import { addTransfer } from "@/lib/actions/transfers";
import type { Account } from "@/lib/database.types";

export default function TransferForm({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  if (accounts.length < 2) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-[var(--accent)] hover:underline"
      >
        + Add transfer between accounts
      </button>
    );
  }

  return (
    <form
      key={formKey}
      className="space-y-2 border-t border-[var(--border)] pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          try {
            await addTransfer(formData);
            setFormKey((k) => k + 1);
            setIsRecurring(false);
            setOpen(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
          }
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <select
          name="from_account_id"
          defaultValue={accounts[0]?.id}
          className="control px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              From: {a.name}
            </option>
          ))}
        </select>
        <select
          name="to_account_id"
          defaultValue={accounts[1]?.id}
          className="control px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              To: {a.name}
            </option>
          ))}
        </select>
      </div>
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
      <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <input
          type="checkbox"
          name="is_recurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Repeats automatically
      </label>
      {isRecurring && (
        <select
          name="recurrence_interval"
          defaultValue="weekly"
          className="control w-full px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly">Monthly</option>
        </select>
      )}
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
          className="control px-3 py-1.5 text-xs font-medium text-[var(--accent-ink)] bg-[var(--accent)] disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save transfer"}
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
