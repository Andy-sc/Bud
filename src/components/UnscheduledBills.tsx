"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSubcategoryDueDay } from "@/lib/actions/categories";
import { money } from "@/lib/format";
import type { UnscheduledBill } from "@/lib/budget";

export default function UnscheduledBills({ bills }: { bills: UnscheduledBill[] }) {
  if (bills.length === 0) return null;

  return (
    <div className="card p-4 space-y-2">
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Unscheduled bills
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        These Fixed bills don&apos;t have a pay day yet — tap one to put it on
        the calendar.
      </p>
      <ul className="space-y-1.5 pt-1">
        {bills.map((b) => (
          <UnscheduledBillRow key={b.subcategoryId} bill={b} />
        ))}
      </ul>
    </div>
  );
}

function UnscheduledBillRow({ bill }: { bill: UnscheduledBill }) {
  const router = useRouter();
  const [assigning, setAssigning] = useState(false);
  const [day, setDay] = useState("");
  const [pending, startTransition] = useTransition();

  if (assigning) {
    return (
      <li>
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = parseInt(day, 10);
            if (!(parsed >= 1 && parsed <= 31)) return;
            startTransition(async () => {
              await updateSubcategoryDueDay(bill.subcategoryId, parsed);
              setAssigning(false);
              router.refresh();
            });
          }}
        >
          <span className="text-sm text-[var(--text-secondary)] flex-1 min-w-0 truncate">
            {bill.name}
          </span>
          <input
            autoFocus
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            onBlur={() => setAssigning(false)}
            placeholder="Day"
            className="control w-16 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)]"
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
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setAssigning(true)}
        className="w-full flex items-center justify-between gap-2 text-sm px-2 py-1.5 rounded-md border border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--text-secondary)] transition"
      >
        <span className="truncate">{bill.categoryName} · {bill.name}</span>
        <span className="tabular-nums shrink-0">{money(bill.amount)}</span>
      </button>
    </li>
  );
}
