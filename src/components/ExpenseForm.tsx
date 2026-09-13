"use client";

import { useMemo, useState, useTransition } from "react";
import { addExpense } from "@/lib/actions/expenses";
import { addCategory, addSubcategory, updateSubcategoryDueDay } from "@/lib/actions/categories";
import type { Account, Category, Subcategory, SubcategoryType } from "@/lib/database.types";

type CategoryWithSubs = Category & { subcategories: Subcategory[] };

const NEW_CATEGORY = "__new_category__";
const NEW_SUBCATEGORY = "__new_subcategory__";

export default function ExpenseForm({
  categories: initialCategories,
  accounts,
}: {
  categories: CategoryWithSubs[];
  accounts: Account[];
}) {
  // Only Fixed and Variable are loggable here — Debt has its own payment
  // flow (Debts page) that reduces the debt's balance, which a generic
  // expense entry wouldn't do.
  const [categories, setCategories] = useState(() =>
    initialCategories.map((c) => ({
      ...c,
      subcategories: c.subcategories.filter((s) => s.type !== "debt"),
    }))
  );

  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, startCreatingCategory] = useTransition();

  const [subcategoryId, setSubcategoryId] = useState("");
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryType, setNewSubcategoryType] = useState<SubcategoryType>("variable");
  const [creatingSubcategory, startCreatingSubcategory] = useTransition();

  const subcategories = useMemo(
    () => categories.find((c) => c.id === categoryId)?.subcategories ?? [],
    [categories, categoryId]
  );

  const activeSubcategoryId = subcategoryId || subcategories[0]?.id || "";
  const activeSubcategory = subcategories.find((s) => s.id === activeSubcategoryId) ?? null;

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY) {
      setAddingCategory(true);
      return;
    }
    setCategoryId(value);
    setSubcategoryId("");
    setAddingSubcategory(false);
  }

  function createCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    startCreatingCategory(async () => {
      try {
        const created = await addCategory(name);
        setCategories((prev) => [...prev, { ...created, subcategories: [] }]);
        setCategoryId(created.id);
        setSubcategoryId("");
        setAddingCategory(false);
        setAddingSubcategory(true);
        setNewCategoryName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't create category.");
      }
    });
  }

  function handleSubcategoryChange(value: string) {
    if (value === NEW_SUBCATEGORY) {
      setAddingSubcategory(true);
      return;
    }
    setSubcategoryId(value);
  }

  function createSubcategory() {
    const name = newSubcategoryName.trim();
    if (!name || !categoryId) return;
    startCreatingSubcategory(async () => {
      try {
        const created = await addSubcategory(categoryId, name, newSubcategoryType, 0);
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId
              ? { ...c, subcategories: [...c.subcategories, created] }
              : c
          )
        );
        setSubcategoryId(created.id);
        setAddingSubcategory(false);
        setNewSubcategoryName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't create subcategory.");
      }
    });
  }

  if (categories.length === 0 && !addingCategory) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">
          You don&apos;t have any categories yet.
        </p>
        <button
          type="button"
          onClick={() => setAddingCategory(true)}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          + New category
        </button>
      </div>
    );
  }

  return (
    <form
      key={formKey}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("subcategory_id", activeSubcategoryId);
        const payDayRaw = formData.get("due_day");
        const payDay = payDayRaw ? parseInt(String(payDayRaw), 10) : null;
        setError(null);
        startTransition(async () => {
          try {
            await addExpense(formData);
            if (
              activeSubcategory?.type === "fixed" &&
              payDay !== (activeSubcategory.due_day ?? null)
            ) {
              await updateSubcategoryDueDay(activeSubcategory.id, payDay);
              setCategories((prev) =>
                prev.map((c) => ({
                  ...c,
                  subcategories: c.subcategories.map((s) =>
                    s.id === activeSubcategory.id ? { ...s, due_day: payDay } : s
                  ),
                }))
              );
            }
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
        {addingCategory ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Health"
              className="control flex-1 px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
            />
            <button
              type="button"
              disabled={creatingCategory}
              onClick={createCategory}
              className="text-xs px-3 py-2 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-60"
            >
              Add
            </button>
            {categories.length > 0 && (
              <button
                type="button"
                onClick={() => setAddingCategory(false)}
                className="text-xs text-[var(--text-muted)] px-2"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <select
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ New category...</option>
          </select>
        )}
      </Field>

      {!addingCategory && (
        <Field label="Subcategory">
          {addingSubcategory ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder="e.g. Copay"
                  className="control flex-1 px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
                />
                <select
                  value={newSubcategoryType}
                  onChange={(e) => setNewSubcategoryType(e.target.value as SubcategoryType)}
                  className="control px-2 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
                >
                  <option value="variable">Variable</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={creatingSubcategory}
                  onClick={createSubcategory}
                  className="text-xs px-3 py-2 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-60"
                >
                  Add
                </button>
                {subcategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAddingSubcategory(false)}
                    className="text-xs text-[var(--text-muted)] px-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <select
              value={activeSubcategoryId}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
            >
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type === "fixed" ? "Fixed" : "Variable"})
                </option>
              ))}
              <option value={NEW_SUBCATEGORY}>+ New subcategory...</option>
            </select>
          )}
        </Field>
      )}

      {activeSubcategory?.type === "fixed" && (
        <Field label="Which day do you want to pay this on?">
          <input
            key={activeSubcategory.id}
            type="number"
            name="due_day"
            min={1}
            max={31}
            defaultValue={activeSubcategory.due_day ?? ""}
            placeholder="e.g. 15"
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
      )}

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
        disabled={pending || !activeSubcategoryId || addingCategory || addingSubcategory}
        className="control w-full py-2.5 font-medium text-[var(--accent-ink)] bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 transition"
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
