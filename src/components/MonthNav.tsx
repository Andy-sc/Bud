import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/date";

export default function MonthNav({
  year,
  month,
  basePath = "/dashboard",
}: {
  year: number;
  month: number;
  basePath?: string;
}) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="flex items-center justify-between gap-4">
      <Link
        href={`${basePath}?year=${prev.year}&month=${prev.month}`}
        className="control w-10 h-10 flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition"
        aria-label="Mes anterior"
      >
        ←
      </Link>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">
        {monthLabel(year, month)}
      </h2>
      <Link
        href={`${basePath}?year=${next.year}&month=${next.month}`}
        className="control w-10 h-10 flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition"
        aria-label="Mes siguiente"
      >
        →
      </Link>
    </div>
  );
}
