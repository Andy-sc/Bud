"use client";

import { useState, useTransition } from "react";
import { addDebt } from "@/lib/actions/debts";

export default function AddDebtForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="control px-4 py-2 text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition"
      >
        + Nueva deuda
      </button>
    );
  }

  return (
    <form
      className="card p-5 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          try {
            await addDebt(formData);
            setOpen(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Algo salió mal.");
          }
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre">
          <input name="name" required className="input" />
        </Field>
        <Field label="A quién se le debe">
          <input name="owed_to" className="input" />
        </Field>
        <Field label="Monto original">
          <input name="original_amount" type="number" step="0.01" required className="input" />
        </Field>
        <Field label="Tasa de interés anual (%)">
          <input name="interest_rate" type="number" step="0.01" defaultValue="0" className="input" />
        </Field>
        <Field label="Fecha de inicio">
          <input name="start_date" type="date" className="input" />
        </Field>
        <Field label="Pago planeado mensual">
          <input name="monthly_payment" type="number" step="0.01" defaultValue="0" className="input" />
        </Field>
      </div>
      {error && <p className="text-sm text-[var(--critical)]">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="control px-4 py-2 text-sm font-medium text-white bg-[var(--series-1)] hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar deuda"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="control px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
        >
          Cancelar
        </button>
      </div>
      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-control);
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 0.875rem;
        }
      `}</style>
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
