"use client";

import { useMemo, useState, useTransition } from "react";
import { estimatePayoff } from "@/lib/budget";
import { updateDebtPlannedPayment } from "@/lib/actions/debts";
import { money } from "@/lib/format";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function DebtPayoffEditor({
  subcategoryId,
  balance,
  interestRate,
  initialPayment,
}: {
  subcategoryId: string | null;
  balance: number;
  interestRate: number;
  initialPayment: number;
}) {
  const [payment, setPayment] = useState(String(initialPayment || ""));
  const [saved, setSaved] = useState(true);
  const [pending, startTransition] = useTransition();

  const estimate = useMemo(() => {
    const p = parseFloat(payment) || 0;
    return estimatePayoff(balance, interestRate, p);
  }, [payment, balance, interestRate]);

  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
        <span>Monthly payment</span>
        <span className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            value={payment}
            onChange={(e) => {
              setPayment(e.target.value);
              setSaved(false);
            }}
            className="control w-24 px-2 py-1 text-sm border border-[var(--border)] bg-[var(--surface)] text-right"
          />
          {!saved && subcategoryId && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await updateDebtPlannedPayment(subcategoryId, parseFloat(payment) || 0);
                  setSaved(true);
                })
              }
              className="text-xs px-2 py-1 rounded-md bg-[var(--series-1)] text-white disabled:opacity-60"
            >
              Save
            </button>
          )}
        </span>
      </label>

      <p className="text-xs text-[var(--text-muted)]">
        {estimate.status === "paid-off" && "This debt is paid off. 🎉"}
        {estimate.status === "no-payment" &&
          "Enter a monthly payment to see your payoff date."}
        {estimate.status === "payment-too-low" &&
          "This payment won't cover the interest — the balance would never go down. Increase it."}
        {estimate.status === "ok" && (
          <>
            Estimated payoff:{" "}
            <span className="font-medium text-[var(--text-secondary)]">
              {MONTH_NAMES[estimate.payoffDate.getMonth()]}{" "}
              {estimate.payoffDate.getFullYear()}
            </span>{" "}
            ({estimate.months} {estimate.months === 1 ? "month" : "months"} at{" "}
            {money(parseFloat(payment) || 0)}/mo)
          </>
        )}
      </p>
    </div>
  );
}
