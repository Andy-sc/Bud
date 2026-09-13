"use client";

import { useState, useTransition } from "react";
import { addGoal } from "@/lib/actions/goals";

export default function GoalForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [savedSoFar, setSavedSoFar] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="control px-4 py-2 text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
      >
        + New goal
      </button>
    );
  }

  return (
    <form
      className="card p-5 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !targetAmount) return;
        startTransition(async () => {
          try {
            await addGoal(
              name.trim(),
              parseFloat(targetAmount) || 0,
              targetDate || null,
              parseFloat(savedSoFar) || 0
            );
            setName("");
            setTargetAmount("");
            setTargetDate("");
            setSavedSoFar("0");
            setOpen(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Goal name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emergency fund"
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
        <Field label="Target amount">
          <input
            type="number"
            step="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00"
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
        <Field label="Target date (optional)">
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
        <Field label="Already saved (optional)">
          <input
            type="number"
            step="0.01"
            value={savedSoFar}
            onChange={(e) => setSavedSoFar(e.target.value)}
            placeholder="0.00"
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
      </div>
      {error && <p className="text-sm text-[var(--critical)]">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="control px-4 py-2 text-sm font-medium text-[var(--accent-ink)] bg-[var(--accent)] disabled:opacity-60"
        >
          Add goal
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--text-muted)]"
        >
          Cancel
        </button>
      </div>
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
