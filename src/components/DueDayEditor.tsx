"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSubcategoryDueDay, updateAccountDueDay } from "@/lib/actions/categories";
import type { CashFlowBillKind } from "@/lib/budget";

export default function DueDayEditor({
  kind,
  id,
  day,
}: {
  kind: CashFlowBillKind;
  id: string;
  day: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(day));
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="hover:text-[var(--accent)] underline decoration-dotted underline-offset-2"
        title="Change the day this is due"
      >
        Day {day}
      </button>
    );
  }

  return (
    <form
      className="inline-flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const newDay = parseInt(value, 10);
        if (newDay >= 1 && newDay <= 31) {
          startTransition(async () => {
            if (kind === "account") {
              await updateAccountDueDay(id, newDay);
            } else {
              await updateSubcategoryDueDay(id, newDay);
            }
            setEditing(false);
            router.refresh();
          });
        }
      }}
    >
      <input
        autoFocus
        type="number"
        min={1}
        max={31}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setEditing(false)}
        className="control w-12 px-1 py-0.5 text-xs border border-[var(--border)] bg-[var(--surface)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-60"
        onMouseDown={(e) => e.preventDefault()}
      >
        OK
      </button>
    </form>
  );
}
