"use client";

import { useState, useTransition } from "react";
import { updateGoalSaved, deleteGoal } from "@/lib/actions/goals";
import { computeGoalProgress } from "@/lib/budget";
import { money } from "@/lib/format";
import type { Goal } from "@/lib/database.types";
import { CloseIcon, CheckCircleIcon } from "@/components/icons";

export default function GoalCard({ goal }: { goal: Goal }) {
  const progress = computeGoalProgress(goal);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(goal.saved_so_far));
  const [pending, startTransition] = useTransition();

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[var(--text-primary)]">{goal.name}</h3>
        <button
          type="button"
          onClick={() => startTransition(() => deleteGoal(goal.id))}
          className="text-[var(--text-muted)] hover:text-[var(--critical)]"
          aria-label="Delete goal"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5 text-sm">
          {editing ? (
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await updateGoalSaved(goal.id, parseFloat(value) || 0);
                  setEditing(false);
                });
              }}
            >
              <input
                autoFocus
                type="number"
                step="0.01"
                value={value}
                onChange={(ev) => setValue(ev.target.value)}
                onBlur={() => setEditing(false)}
                className="control w-24 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
              />
              <button
                type="submit"
                disabled={pending}
                className="text-xs px-2 py-1 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-60"
                onMouseDown={(e) => e.preventDefault()}
              >
                OK
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="tabular-nums font-medium text-[var(--text-primary)] hover:text-[var(--accent)] underline decoration-dotted underline-offset-2"
            >
              {money(goal.saved_so_far)}
            </button>
          )}
          <span className="tabular-nums text-[var(--text-muted)]">
            of {money(goal.target_amount)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--gridline)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress.pctSaved * 100}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      {goal.target_date ? (
        progress.remaining === 0 ? (
          <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--good)" }}>
            <CheckCircleIcon className="w-4 h-4" />
            Goal reached!
          </p>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            Save{" "}
            <span className="font-medium text-[var(--text-primary)] tabular-nums">
              {money(progress.monthlyContribution ?? 0)}
            </span>
            /mo to reach it by{" "}
            {new Date(`${goal.target_date}T00:00:00`).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
            {progress.monthsLeft !== null &&
              ` (${progress.monthsLeft} ${progress.monthsLeft === 1 ? "month" : "months"} left)`}
          </p>
        )
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No target date set.</p>
      )}
    </div>
  );
}
