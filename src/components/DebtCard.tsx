"use client";

import { useTransition } from "react";
import ProgressBar from "@/components/ProgressBar";
import DebtPaymentForm from "@/components/DebtPaymentForm";
import DebtPayoffEditor from "@/components/DebtPayoffEditor";
import DebtDetailsEditor from "@/components/DebtDetailsEditor";
import { deleteDebt } from "@/lib/actions/debts";
import { money, pct } from "@/lib/format";
import type { DebtComputed } from "@/lib/budget";
import type { Account } from "@/lib/database.types";
import { CloseIcon, CheckCircleIcon } from "@/components/icons";

export default function DebtCard({
  debt,
  accounts,
}: {
  debt: DebtComputed;
  accounts: Account[];
}) {
  const [pending, startTransition] = useTransition();
  const paidOff = debt.currentBalance <= 0;

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">{debt.name}</h3>
          {debt.owed_to && (
            <p className="text-xs text-[var(--text-muted)]">Owed to {debt.owed_to}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {paidOff ? (
            <span
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--good)" }}
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Paid off
            </span>
          ) : (
            <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums">
              {pct(debt.pctPaid)} paid
            </span>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  `Delete "${debt.name}" and its whole payment history? This can't be undone.`
                )
              ) {
                startTransition(() => deleteDebt(debt.id));
              }
            }}
            className="text-[var(--text-muted)] hover:text-[var(--critical)] disabled:opacity-60"
            aria-label="Delete debt"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5 text-sm">
          <span className="tabular-nums font-medium text-[var(--text-primary)]">
            {money(debt.currentBalance)} remaining
          </span>
          <span className="tabular-nums text-[var(--text-muted)]">
            of {money(debt.original_amount)}
          </span>
        </div>
        <ProgressBar pctUsed={debt.pctPaid} />
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>Paid so far: {money(debt.paidSoFar)}</span>
        {debt.interest_rate > 0 && <span>Interest: {debt.interest_rate}%</span>}
      </div>

      {paidOff && (
        <p className="text-xs text-[var(--text-muted)]">
          No longer shows up in your monthly budget — it stays here for the record.
        </p>
      )}

      <DebtPayoffEditor
        subcategoryId={debt.subcategoryId}
        balance={debt.currentBalance}
        interestRate={debt.interest_rate}
        initialPayment={debt.plannedMonthlyPayment}
      />

      <div className="border-t border-[var(--border)] pt-3 space-y-2">
        <DebtPaymentForm debtId={debt.id} accounts={accounts} />
        <DebtDetailsEditor
          debtId={debt.id}
          name={debt.name}
          owedTo={debt.owed_to}
          originalAmount={debt.original_amount}
          interestRate={debt.interest_rate}
        />
      </div>
    </div>
  );
}
