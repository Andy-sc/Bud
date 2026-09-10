"use client";

import { useState, useTransition } from "react";
import { addIncome } from "@/lib/actions/income";
import type { Account } from "@/lib/database.types";

export default function IncomeForm({ accounts }: { accounts: Account[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  return (
    <form
      key={formKey}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          try {
            await addIncome(formData);
            setFormKey((k) => k + 1);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Algo salió mal.");
          }
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <input
            type="date"
            name="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
        <Field label="Monto">
          <input
            type="number"
            step="0.01"
            name="amount"
            required
            placeholder="0.00"
            className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </Field>
      </div>

      <Field label="Fuente">
        <input
          type="text"
          name="source"
          placeholder="ej. Paycheck"
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </Field>

      <Field label="Cuenta">
        <select
          name="account_id"
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        >
          <option value="">Sin especificar</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Nota (opcional)">
        <input
          type="text"
          name="note"
          className="control w-full px-3 py-2 border border-[var(--border)] bg-[var(--surface)] text-sm"
        />
      </Field>

      {error && <p className="text-sm text-[var(--critical)]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="control w-full py-2.5 font-medium text-white bg-[var(--good)] hover:opacity-90 disabled:opacity-60 transition"
      >
        {pending ? "Guardando..." : "Registrar ingreso"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
