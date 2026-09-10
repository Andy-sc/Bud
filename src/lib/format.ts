export function money(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}
