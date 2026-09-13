"use client";

import { useState, useTransition } from "react";
import { addIncome } from "@/lib/actions/income";
import type { Account, RecurrenceInterval } from "@/lib/database.types";

export default function IncomeForm({ accounts }: { accounts: Account[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState<RecurrenceInterval>("weekly");

  return (
    <form
      key={formKey}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          try {
            await addIncome(formData);
            setFormKey((k) => k + 1);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input
            type="date"
            name="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
        <Field label="Amount">
          <input
            type="number"
            step="0.01"
            name="amount"
            required
            placeholder="0.00"
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
      </div>

      <Field label="Source">
        <input
          type="text"
          name="source"
          placeholder="e.g. Paycheck"
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </Field>

      <Field label="Account">
        <select
          name="account_id"
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        >
          <option value="">Unspecified</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            name="is_recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          This is a recurring income
        </label>
        {isRecurring && (
          <Field label="How often">
            <select
              name="recurrence_interval"
              value={interval}
              onChange={(e) => setInterval(e.target.value as RecurrenceInterval)}
              className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
        )}
      </div>

      <Field label="Note (optional)">
        <input
          type="text"
          name="note"
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </Field>

      {error && <p className="text-sm text-[var(--critical)]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="control w-full py-2.5 font-medium text-[var(--accent-ink)] bg-[var(--good)] hover:opacity-90 disabled:opacity-60 transition"
      >
        {pending ? "Saving..." : "Log income"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
