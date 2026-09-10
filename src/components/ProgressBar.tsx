function statusColor(pctUsed: number) {
  if (pctUsed > 1) return "var(--critical)";
  if (pctUsed >= 0.85) return "var(--warning)";
  return "var(--good)";
}

export default function ProgressBar({ pctUsed }: { pctUsed: number }) {
  const width = Math.min(pctUsed, 1) * 100;
  const color = statusColor(pctUsed);
  const over = pctUsed > 1;

  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-[var(--gridline)] overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${width}%`, background: color }}
        />
        {over && (
          <div
            className="absolute top-0 right-0 h-full w-1 rounded-full"
            style={{ background: "var(--critical)" }}
          />
        )}
      </div>
    </div>
  );
}
