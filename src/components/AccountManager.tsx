"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAccount, deleteAccount, updateAccountDetails } from "@/lib/actions/categories";
import { money } from "@/lib/format";
import TransferForm from "@/components/TransferForm";
import type { Account, AccountType } from "@/lib/database.types";

const TYPE_LABEL: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit card",
  investment: "Investment",
  cash: "Cash",
};

export default function AccountManager({ accounts }: { accounts: Account[] }) {
  return (
    <div className="card p-5 space-y-3">
      <ul className="space-y-2">
        {accounts.map((a) => (
          <AccountRow key={a.id} account={a} />
        ))}
      </ul>
      <NewAccountForm />
      <TransferForm accounts={accounts} />
    </div>
  );
}

function AccountRow({ account }: { account: Account }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [accountType, setAccountType] = useState<AccountType>(account.account_type);
  const [balance, setBalance] = useState(String(account.starting_balance));
  const [balanceAsOf, setBalanceAsOf] = useState(account.balance_as_of ?? "");
  const [dueDay, setDueDay] = useState(account.due_day != null ? String(account.due_day) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="border-t border-[var(--border)] pt-2 first:border-0 first:pt-0">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              try {
                await updateAccountDetails(
                  account.id,
                  name,
                  accountType,
                  parseFloat(balance) || 0,
                  balanceAsOf || null,
                  dueDay ? parseInt(dueDay, 10) : null
                );
                setEditing(false);
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Error");
              }
            });
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm flex-1 min-w-[100px]"
          />
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          >
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => {
              setBalance(e.target.value);
              // Changing the balance means "this is what I have right now" —
              // auto-bump the as-of date to today so past transactions don't
              // also get added on top of the new number.
              setBalanceAsOf(new Date().toISOString().slice(0, 10));
            }}
            title={accountType === "credit" ? "Amount currently owed" : "Current balance"}
            className="control w-24 px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
          <input
            type="date"
            value={balanceAsOf}
            onChange={(e) => setBalanceAsOf(e.target.value)}
            title="Balance as of — auto-updates to today when you change the balance above"
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
          {accountType === "credit" && (
            <input
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="Pay day"
              title="Day of month this card's payment is due — shows it on the Calendar"
              className="control w-20 px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm"
            />
          )}
          <button type="submit" disabled={pending} className="text-xs text-[var(--accent)]">
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-[var(--text-muted)]"
          >
            Cancel
          </button>
        </form>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Changing the balance updates it to what you have right now — past
          transactions won&apos;t be added on top.
        </p>
        {error && <p className="text-xs text-[var(--critical)] mt-1">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between text-sm border-t border-[var(--border)] pt-2 first:border-0 first:pt-0">
      <button
        onClick={() => setEditing(true)}
        className="text-left text-[var(--text-primary)] hover:text-[var(--accent)]"
      >
        {account.name}
        <span className="block text-xs text-[var(--text-muted)]">
          {TYPE_LABEL[account.account_type]} · {money(account.starting_balance)}
          {account.account_type === "credit" &&
            (account.due_day ? ` · due day ${account.due_day}` : " · no pay day set")}
        </span>
      </button>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteAccount(account.id);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Error");
            }
          })
        }
        className="text-xs text-[var(--text-muted)] hover:text-[var(--critical)]"
      >
        Delete
      </button>
    </li>
  );
}

function NewAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("checking");
  const [balance, setBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-[var(--accent)] hover:underline"
      >
        + Add account
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          try {
            await addAccount(name.trim(), accountType, parseFloat(balance) || 0);
            setName("");
            setBalance("0");
            setOpen(false);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
          }
        });
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Account name"
        className="control flex-1 min-w-[120px] px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
      />
      <select
        value={accountType}
        onChange={(e) => setAccountType(e.target.value as AccountType)}
        className="control px-2 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
      >
        {Object.entries(TYPE_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.01"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        placeholder="Balance"
        className="control w-24 px-2 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="control px-4 py-2 text-sm font-medium text-[var(--accent-ink)] bg-[var(--accent)] disabled:opacity-60"
      >
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)]">
        Cancel
      </button>
      {error && <p className="text-xs text-[var(--critical)] w-full">{error}</p>}
    </form>
  );
}
