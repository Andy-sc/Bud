"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import type { AccountBalance, AccountSummary as AccountSummaryData } from "@/lib/budget";
import { ChevronRightIcon } from "@/components/icons";

const GROUPS: { key: keyof AccountSummaryData & string; label: string; totalKey: keyof AccountSummaryData }[] = [
  { key: "checking", label: "Checking", totalKey: "totalChecking" },
  { key: "savings", label: "Savings", totalKey: "totalSavings" },
  { key: "credit", label: "Credit cards", totalKey: "totalCredit" },
  { key: "investment", label: "Investments", totalKey: "totalInvestment" },
  { key: "cash", label: "Cash", totalKey: "totalCash" },
];

export default function AccountSummary({ data }: { data: AccountSummaryData }) {
  return (
    <div className="card p-5 space-y-4">
      <div>
        <p className="text-xs text-[var(--text-muted)]">Balance across accounts</p>
        <p
          className="text-2xl font-semibold tabular-nums"
          style={{ color: data.netCash >= 0 ? "var(--good)" : "var(--critical)" }}
        >
          {money(data.netCash)}
        </p>
        <p className="text-xs text-[var(--text-muted)]">Checking + Savings + Cash − Credit cards</p>
      </div>

      <div className="space-y-1">
        {GROUPS.map((g) => {
          const accounts = data[g.key] as AccountBalance[];
          if (accounts.length === 0) return null;
          const total = data[g.totalKey] as number;
          return <AccountGroupRow key={g.key} label={g.label} total={total} accounts={accounts} />;
        })}
      </div>
    </div>
  );
}

function AccountGroupRow({
  label,
  total,
  accounts,
}: {
  label: string;
  total: number;
  accounts: AccountBalance[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[var(--border)] pt-2 first:border-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-sm"
      >
        <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
          <ChevronRightIcon
            className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          {label}
        </span>
        <span className="tabular-nums font-medium text-[var(--text-primary)]">{money(total)}</span>
      </button>
      {open && (
        <ul className="mt-1.5 ml-5 space-y-1">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between text-xs text-[var(--text-secondary)]"
            >
              <span>{a.name}</span>
              <span className="tabular-nums">{money(a.currentBalance)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
