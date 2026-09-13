"use client";

import { useState, useTransition } from "react";
import { deleteIncome, updateIncome } from "@/lib/actions/income";
import { money } from "@/lib/format";
import type { Account, Income } from "@/lib/database.types";
import { CloseIcon } from "@/components/icons";

export default function IncomeHistoryList({
  income,
  accounts,
}: {
  income: Income[];
  accounts: Account[];
}) {
  const accountById = new Map(accounts.map((a) => [a.id, a.name]));

  if (income.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-4">
        You haven&apos;t logged any income yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {income.map((i) => (
        <IncomeRow key={i.id} income={i} accounts={accounts} accountById={accountById} />
      ))}
    </div>
  );
}

function IncomeRow({
  income: i,
  accounts,
  accountById,
}: {
  income: Income;
  accounts: Account[];
  accountById: Map<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(i.is_recurring);

  if (editing) {
    return (
      <form
        className="py-2.5 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            try {
              await updateIncome(i.id, formData);
              setEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Error");
            }
          });
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            name="date"
            defaultValue={i.date}
            required
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
          <input
            type="number"
            step="0.01"
            name="amount"
            defaultValue={i.amount}
            required
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </div>
        <input
          type="text"
          name="source"
          defaultValue={i.source ?? ""}
          placeholder="Source"
          className="control w-full px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
        <select
          name="account_id"
          defaultValue={i.account_id ?? ""}
          className="control w-full px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
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
          defaultValue={i.note ?? ""}
          placeholder="Note"
          className="control w-full px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            name="is_recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Recurring income
        </label>
        {isRecurring && (
          <select
            name="recurrence_interval"
            defaultValue={i.recurrence_interval ?? "weekly"}
            className="control w-full px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        )}
        {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="text-xs px-3 py-1.5 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-[var(--text-muted)]"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="py-2.5 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="min-w-0 text-left hover:opacity-80"
      >
        <p className="text-sm text-[var(--text-primary)] truncate">{i.source || "Income"}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {i.date} · {i.account_id ? accountById.get(i.account_id) : "no account"}
          {i.note ? ` · ${i.note}` : ""}
          {i.is_recurring ? ` · recurring (${i.recurrence_interval})` : ""}
        </p>
      </button>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium tabular-nums text-[var(--good)]">
          {money(Number(i.amount))}
        </span>
        <button
          type="button"
          onClick={() => startTransition(() => deleteIncome(i.id))}
          className="text-[var(--text-muted)] hover:text-[var(--critical)] text-sm"
          aria-label="Delete"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
