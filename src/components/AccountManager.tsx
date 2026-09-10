"use client";

import { useState, useTransition } from "react";
import { addAccount, deleteAccount, renameAccount } from "@/lib/actions/categories";
import type { Account } from "@/lib/database.types";

export default function AccountManager({ accounts }: { accounts: Account[] }) {
  return (
    <div className="card p-5 space-y-3">
      <ul className="space-y-2">
        {accounts.map((a) => (
          <AccountRow key={a.id} account={a} />
        ))}
      </ul>
      <NewAccountForm />
    </div>
  );
}

function AccountRow({ account }: { account: Account }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              try {
                await renameAccount(account.id, name);
                setEditing(false);
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
            className="control px-2 py-1 border border-[var(--border)] bg-[var(--surface)] text-sm flex-1"
          />
          <button type="submit" className="text-xs text-[var(--series-1)]">
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
        {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between text-sm border-t border-[var(--border)] pt-2 first:border-0 first:pt-0">
      <button
        onClick={() => setEditing(true)}
        className="text-[var(--text-primary)] hover:text-[var(--series-1)]"
      >
        {account.name}
      </button>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteAccount(account.id);
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-[var(--series-1)] hover:underline"
      >
        + Add account
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          try {
            await addAccount(name.trim());
            setName("");
            setOpen(false);
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
        className="control flex-1 px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="control px-4 py-2 text-sm font-medium text-white bg-[var(--series-1)] disabled:opacity-60"
      >
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)]">
        Cancel
      </button>
      {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
    </form>
  );
}
