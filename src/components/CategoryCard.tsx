"use client";

import { useState } from "react";
import ProgressBar from "@/components/ProgressBar";
import FixedActualEditor from "@/components/FixedActualEditor";
import PlannedAmountEditor from "@/components/PlannedAmountEditor";
import SubcategoryNameEditor from "@/components/SubcategoryNameEditor";
import { money, pct } from "@/lib/format";
import { categoryColorVar } from "@/lib/categoryColors";
import { ChevronRightIcon } from "@/components/icons";
import type { CategoryComputed } from "@/lib/budget";

const TYPE_LABEL: Record<string, string> = {
  fixed: "Fixed",
  variable: "Variable",
  debt: "Debt",
};

export default function CategoryCard({
  category,
  year,
  month,
  incomePlanned,
}: {
  category: CategoryComputed;
  year: number;
  month: number;
  incomePlanned: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = categoryColorVar(category.name);
  const shareOfIncome = incomePlanned > 0 ? category.planned / incomePlanned : 0;

  return (
    <div className="card p-5 space-y-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: color }}
          />
          <h3 className="font-semibold text-[var(--text-primary)] truncate">
            {category.name}
          </h3>
          <span className="text-xs text-[var(--text-muted)] tabular-nums shrink-0">
            {pct(shareOfIncome)} of income
          </span>
        </div>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums">
            {pct(category.pctUsed)}
          </span>
          <ChevronRightIcon
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </span>
      </button>

      <div>
        <div className="flex items-baseline justify-between mb-1.5 text-sm">
          <span className="tabular-nums font-medium text-[var(--text-primary)]">
            {money(category.actual)}
          </span>
          <span className="tabular-nums text-[var(--text-muted)]">
            of {money(category.planned)}
          </span>
        </div>
        <ProgressBar pctUsed={category.pctUsed} />
      </div>

      {expanded && (
        <ul className="space-y-2 pt-1">
          {category.subcategories.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center justify-between gap-2 text-sm border-t border-[var(--border)] pt-2 first:border-0 first:pt-0"
            >
              <div className="min-w-0">
                {sub.type === "debt" ? (
                  <p className="text-[var(--text-primary)] truncate">{sub.name}</p>
                ) : (
                  <SubcategoryNameEditor
                    subcategoryId={sub.id}
                    name={sub.name}
                    plannedAmount={sub.planned}
                    dueDay={sub.due_day}
                    isBuffer={sub.is_buffer}
                  />
                )}
                <p className="text-xs text-[var(--text-muted)]">
                  {TYPE_LABEL[sub.type]} ·{" "}
                  {sub.type === "debt" ? (
                    `plan ${money(sub.planned)}`
                  ) : (
                    <PlannedAmountEditor subcategoryId={sub.id} planned={sub.planned} />
                  )}
                </p>
              </div>
              {sub.type === "fixed" ? (
                <FixedActualEditor
                  subcategoryId={sub.id}
                  year={year}
                  month={month}
                  actual={sub.actual}
                />
              ) : (
                <span className="text-sm tabular-nums text-[var(--text-secondary)]">
                  {money(sub.actual)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
