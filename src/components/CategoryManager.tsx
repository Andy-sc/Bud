"use client";

import { useState, useTransition } from "react";
import {
  addCategory,
  addSubcategory,
  deleteCategory,
  deleteSubcategory,
  renameCategory,
  updateSubcategory,
} from "@/lib/actions/categories";
import { money } from "@/lib/format";
import type { Category, Subcategory, SubcategoryType } from "@/lib/database.types";

type CategoryWithSubs = Category & { subcategories: Subcategory[] };

const TYPE_LABEL: Record<SubcategoryType, string> = {
  fixed: "Fijo",
  variable: "Variable",
  debt: "Deuda",
};

export default function CategoryManager({
  categories,
}: {
  categories: CategoryWithSubs[];
}) {
  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <CategoryRow key={cat.id} category={cat} />
      ))}
      <NewCategoryForm />
    </div>
  );
}

function CategoryRow({ category }: { category: CategoryWithSubs }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [addingSub, setAddingSub] = useState(false);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        {editingName ? (
          <form
            className="flex items-center gap-2 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                try {
                  await renameCategory(category.id, name);
                  setEditingName(false);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Error");
                }
              });
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold"
            />
            <button type="submit" className="text-xs text-[var(--series-1)]">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditingName(false)}
              className="text-xs text-[var(--text-muted)]"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="font-semibold text-[var(--text-primary)] hover:text-[var(--series-1)]"
          >
            {category.name}
          </button>
        )}
        {!category.is_debt && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteCategory(category.id);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Error");
                }
              })
            }
            className="text-xs text-[var(--text-muted)] hover:text-[var(--critical)]"
          >
            Eliminar categoría
          </button>
        )}
      </div>

      {error && <p className="text-xs text-[var(--critical)]">{error}</p>}

      <ul className="space-y-2">
        {category.subcategories.map((sub) => (
          <SubcategoryRow key={sub.id} sub={sub} />
        ))}
      </ul>

      {addingSub ? (
        <NewSubcategoryForm
          categoryId={category.id}
          onDone={() => setAddingSub(false)}
        />
      ) : (
        <button
          onClick={() => setAddingSub(true)}
          className="text-sm text-[var(--series-1)] hover:underline"
        >
          + Agregar subcategoría
        </button>
      )}
    </div>
  );
}

function SubcategoryRow({ sub }: { sub: Subcategory }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);
  const [amount, setAmount] = useState(String(sub.planned_amount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sub.type === "debt") {
    return (
      <li className="flex items-center justify-between gap-2 text-sm border-t border-[var(--border)] pt-2 first:border-0 first:pt-0">
        <div>
          <p className="text-[var(--text-primary)]">{sub.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            Deuda · gestiónala desde la pestaña &quot;Deudas&quot;
          </p>
        </div>
        <span className="text-sm tabular-nums text-[var(--text-secondary)]">
          {money(sub.planned_amount)}
        </span>
      </li>
    );
  }

  if (editing) {
    return (
      <li className="border-t border-[var(--border)] pt-2 first:border-0 first:pt-0">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              try {
                await updateSubcategory(sub.id, name, parseFloat(amount) || 0);
                setEditing(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Error");
              }
            });
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm flex-1 min-w-[120px]"
          />
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="control w-24 px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
          <button type="submit" disabled={pending} className="text-xs text-[var(--series-1)]">
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-[var(--text-muted)]"
          >
            Cancelar
          </button>
        </form>
        {error && <p className="text-xs text-[var(--critical)] mt-1">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 text-sm border-t border-[var(--border)] pt-2 first:border-0 first:pt-0">
      <button
        onClick={() => setEditing(true)}
        className="text-left text-[var(--text-primary)] hover:text-[var(--series-1)]"
      >
        {sub.name}
        <span className="block text-xs text-[var(--text-muted)]">
          {TYPE_LABEL[sub.type]} · plan {money(sub.planned_amount)}
        </span>
      </button>
      <button
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteSubcategory(sub.id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Error");
            }
          })
        }
        className="text-[var(--text-muted)] hover:text-[var(--critical)] text-xs shrink-0"
      >
        Eliminar
      </button>
    </li>
  );
}

function NewSubcategoryForm({
  categoryId,
  onDone,
}: {
  categoryId: string;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SubcategoryType>("variable");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          try {
            await addSubcategory(categoryId, name.trim(), type, parseFloat(amount) || 0);
            onDone();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
          }
        });
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        className="control px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm flex-1 min-w-[120px]"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as SubcategoryType)}
        className="control px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
      >
        <option value="variable">Variable</option>
        <option value="fixed">Fijo</option>
      </select>
      <input
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Planned"
        className="control w-24 px-2 py-1.5 border border-[var(--border)] bg-[var(--surface)] text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="control px-3 py-1.5 text-sm font-medium text-white bg-[var(--series-1)] disabled:opacity-60"
      >
        Agregar
      </button>
      <button type="button" onClick={onDone} className="text-sm text-[var(--text-muted)]">
        Cancelar
      </button>
      {error && <p className="text-xs text-[var(--critical)] w-full">{error}</p>}
    </form>
  );
}

function NewCategoryForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="control px-4 py-2 text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
      >
        + Nueva categoría
      </button>
    );
  }

  return (
    <form
      className="card p-4 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          try {
            await addCategory(name.trim());
            setName("");
            setOpen(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
          }
        });
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la categoría"
        className="control flex-1 px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="control px-4 py-2 text-sm font-medium text-white bg-[var(--series-1)] disabled:opacity-60"
      >
        Agregar
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)]">
        Cancelar
      </button>
      {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
    </form>
  );
}
