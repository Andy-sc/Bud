"use client";

import { useState, useTransition } from "react";
import { seedStarterBudget } from "@/app/(app)/actions";

export default function Onboarding() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8 text-center space-y-4">
        <div className="text-4xl">🌱</div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          ¡Bienvenida a tu presupuesto!
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Todavía no tienes categorías configuradas. Carga la plantilla inicial
          (Home, Transportation, Daily Living, Personal, Savings/Investing,
          Travel, Debt, Buffer) con montos de ejemplo — luego puedes editar,
          agregar o eliminar cualquier cosa desde &quot;Categorías&quot;.
        </p>
        {error && <p className="text-sm text-[var(--critical)]">{error}</p>}
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await seedStarterBudget();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Algo salió mal.");
              }
            })
          }
          className="control w-full py-3 font-medium text-white bg-[var(--series-1)] hover:opacity-90 disabled:opacity-60 transition"
        >
          {pending ? "Cargando..." : "Cargar plantilla inicial"}
        </button>
      </div>
    </div>
  );
}
