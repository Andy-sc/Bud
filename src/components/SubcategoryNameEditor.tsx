"use client";

import { useState, useTransition } from "react";
import { updateSubcategory, deleteSubcategory } from "@/lib/actions/categories";
import { CloseIcon } from "@/components/icons";

export default function SubcategoryNameEditor({
  subcategoryId,
  name,
  plannedAmount,
  dueDay,
  isBuffer,
}: {
  subcategoryId: string;
  name: string;
  plannedAmount: number;
  dueDay: number | null;
  isBuffer: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteSubcategory(subcategoryId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't delete.");
      }
    });
  }

  if (editing) {
    return (
      <div className="min-w-0">
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = value.trim();
            if (!trimmed) return;
            setError(null);
            startTransition(async () => {
              try {
                await updateSubcategory(subcategoryId, trimmed, plannedAmount, dueDay, isBuffer);
                setEditing(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Couldn't save.");
              }
            });
          }}
        >
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setEditing(false)}
            className="control px-1.5 py-0.5 text-sm border border-[var(--border)] bg-[var(--surface)] min-w-0 flex-1"
          />
          <button
            type="submit"
            disabled={pending}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-60 shrink-0"
            onMouseDown={(e) => e.preventDefault()}
          >
            OK
          </button>
        </form>
        {error && <p className="text-[10px] text-[var(--critical)] mt-0.5">{error}</p>}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[var(--text-primary)] truncate hover:text-[var(--accent)] text-left min-w-0"
        >
          {name}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="text-[var(--text-muted)] hover:text-[var(--critical)] shrink-0 disabled:opacity-60"
          aria-label={`Delete ${name}`}
        >
          <CloseIcon className="w-3 h-3" />
        </button>
      </span>
      {error && <p className="text-[10px] text-[var(--critical)] mt-0.5">{error}</p>}
    </div>
  );
}
