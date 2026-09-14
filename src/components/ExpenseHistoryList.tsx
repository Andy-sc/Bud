"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteExpense, updateExpense } from "@/lib/actions/expenses";
import { money } from "@/lib/format";
import type { Account, Category, Expense, Subcategory } from "@/lib/database.types";
import { CloseIcon } from "@/components/icons";

type CategoryWithSubs = Category & { subcategories: Subcategory[] };

export default function ExpenseHistoryList({
  expenses,
  categories,
  accounts,
}: {
  expenses: Expense[];
  categories: CategoryWithSubs[];
  accounts: Account[];
}) {
  const [query, setQuery] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");

  const subcatById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) {
      for (const s of c.subcategories) m.set(s.id, `${c.name} · ${s.name}`);
    }
    return m;
  }, [categories]);
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );
  const loggableCategories = categories
    .map((c) => ({ ...c, subcategories: c.subcategories.filter((s) => s.type !== "debt") }))
    .filter((c) => c.subcategories.length > 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (subcategoryFilter && e.subcategory_id !== subcategoryFilter) return false;
      if (!q) return true;
      const label = (subcatById.get(e.subcategory_id) ?? "").toLowerCase();
      const account = (e.account_id ? accountById.get(e.account_id) : "") ?? "";
      const note = e.note ?? "";
      return (
        label.includes(q) || account.toLowerCase().includes(q) || note.toLowerCase().includes(q)
      );
    });
  }, [expenses, query, subcategoryFilter, subcatById, accountById]);

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-4">
        You haven&apos;t logged any expenses yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search note, category, account..."
          className="control flex-1 px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)]"
        />
        <select
          value={subcategoryFilter}
          onChange={(e) => setSubcategoryFilter(e.target.value)}
          className="control px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)]"
        >
          <option value="">All categories</option>
          {loggableCategories.map((c) => (
            <optgroup key={c.id} label={c.name}>
              {c.subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-4">No expenses match your search.</p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {filtered.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              categories={loggableCategories}
              accounts={accounts}
              subcatById={subcatById}
              accountById={accountById}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseRow({
  expense: e,
  categories,
  accounts,
  subcatById,
  accountById,
}: {
  expense: Expense;
  categories: CategoryWithSubs[];
  accounts: Account[];
  subcatById: Map<string, string>;
  accountById: Map<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <form
        className="py-2.5 space-y-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          const formData = new FormData(ev.currentTarget);
          setError(null);
          startTransition(async () => {
            try {
              await updateExpense(e.id, formData);
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
            defaultValue={e.date}
            required
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
          <input
            type="number"
            step="0.01"
            name="amount"
            defaultValue={e.amount}
            required
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </div>
        <select
          name="subcategory_id"
          defaultValue={e.subcategory_id}
          required
          className="control w-full px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
        >
          {categories.map((c) => (
            <optgroup key={c.id} label={c.name}>
              {c.subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          name="account_id"
          defaultValue={e.account_id ?? ""}
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
          defaultValue={e.note ?? ""}
          placeholder="Note"
          className="control w-full px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
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
        <p className="text-sm text-[var(--text-primary)] truncate">
          {subcatById.get(e.subcategory_id) ?? "—"}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {e.date} · {e.account_id ? accountById.get(e.account_id) : "no account"}
          {e.note ? ` · ${e.note}` : ""}
        </p>
      </button>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium tabular-nums text-[var(--series-8)]">
          {money(Number(e.amount))}
        </span>
        <button
          type="button"
          onClick={() => startTransition(() => deleteExpense(e.id))}
          className="text-[var(--text-muted)] hover:text-[var(--critical)] text-sm"
          aria-label="Delete"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
