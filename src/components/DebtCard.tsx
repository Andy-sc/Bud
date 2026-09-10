import ProgressBar from "@/components/ProgressBar";
import DebtPaymentForm from "@/components/DebtPaymentForm";
import DebtPayoffEditor from "@/components/DebtPayoffEditor";
import DebtDetailsEditor from "@/components/DebtDetailsEditor";
import { money, pct } from "@/lib/format";
import type { DebtComputed } from "@/lib/budget";
import type { Account } from "@/lib/database.types";

export default function DebtCard({
  debt,
  accounts,
}: {
  debt: DebtComputed;
  accounts: Account[];
}) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">{debt.name}</h3>
          {debt.owed_to && (
            <p className="text-xs text-[var(--text-muted)]">Owed to {debt.owed_to}</p>
          )}
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums">
          {pct(debt.pctPaid)} paid
        </span>
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
          owedTo={debt.owed_to}
          originalAmount={debt.original_amount}
          interestRate={debt.interest_rate}
        />
      </div>
    </div>
  );
}
