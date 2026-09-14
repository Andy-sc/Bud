"use client";

import { useState, useTransition } from "react";
import { updateGoalDetails } from "@/lib/actions/goals";

export default function GoalDetailsEditor({
  goalId,
  name,
  targetAmount,
  targetDate,
}: {
  goalId: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [goalName, setGoalName] = useState(name);
  const [target, setTarget] = useState(String(targetAmount));
  const [date, setDate] = useState(targetDate ?? "");
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
      >
        Edit details
      </button>
    );
  }

  return (
    <form
      className="grid grid-cols-2 gap-2 pt-1"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateGoalDetails(goalId, {
            name: goalName.trim() || name,
            targetAmount: parseFloat(target) || 0,
            targetDate: date || null,
          });
          setEditing(false);
        });
      }}
    >
      <label className="text-xs text-[var(--text-muted)] col-span-2">
        Name
        <input
          value={goalName}
          onChange={(e) => setGoalName(e.target.value)}
          className="control w-full mt-0.5 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
        />
      </label>
      <label className="text-xs text-[var(--text-muted)]">
        Target amount
        <input
          type="number"
          step="0.01"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="control w-full mt-0.5 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
        />
      </label>
      <label className="text-xs text-[var(--text-muted)]">
        Target date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="control w-full mt-0.5 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
        />
      </label>
      <div className="col-span-2 flex gap-2">
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
          className="text-xs px-3 py-1.5 text-[var(--text-secondary)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
