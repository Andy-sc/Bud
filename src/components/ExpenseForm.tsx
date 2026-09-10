"use client";

import { useMemo, useState, useTransition } from "react";
import { addExpense } from "@/lib/actions/expenses";
import type { Account, Category, Subcategory } from "@/lib/database.types";

type CategoryWithSubs = Category & { subcategories: Subcategory[] };

export default function ExpenseForm({
  categories,
  accounts,
}: {
  categories: CategoryWithSubs[];
  accounts: Account[];
}) {
  const variableCategories = useMemo(
    () =>
      categories
        .map((c) => ({
          ...c,
          subcategories: c.subcategories.filter((s) => s.type === "variable"),
        }))
        .filter((c) => c.subcategories.length > 0),
    [categories]
  );

  const [categoryId, setCategoryId] = useState(variableCategories[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const subcategories =
    variableCategories.find((c) => c.id === categoryId)?.subcategories ?? [];

  if (variableCategories.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        You don&apos;t have any Variable subcategories yet. Create them in
        &quot;Categories&quot;.
      </p>
    );
  }

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
            await addExpense(formData);
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

      <Field label="Category">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        >
          {variableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Subcategory">
        <select
          name="subcategory_id"
          required
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        >
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
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

      <Field label="Note (optional)">
        <input
          type="text"
          name="note"
          placeholder="e.g. weekly groceries"
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </Field>

      {error && <p className="text-sm text-[var(--critical)]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="control w-full py-2.5 font-medium text-white bg-[var(--series-1)] hover:opacity-90 disabled:opacity-60 transition"
      >
        {pending ? "Saving..." : "Log expense"}
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
