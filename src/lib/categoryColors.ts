// Fixed categorical order (matches the original spreadsheet's category order).
// Never reassign a color based on filtering/sorting — always look up by name.
const ORDER = [
  "Home",
  "Transportation",
  "Daily Living",
  "Personal",
  "Savings/Investing",
  "Travel",
  "Debt",
  "Buffer",
];

export function categoryColorVar(name: string): string {
  const idx = ORDER.indexOf(name);
  const slot = idx === -1 ? (hash(name) % 8) + 1 : idx + 1;
  return `var(--series-${slot})`;
}

export function categoryColorHex(name: string, resolved: Record<string, string>): string {
  const varName = categoryColorVar(name).replace("var(", "").replace(")", "");
  return resolved[varName] ?? "#2a78d6";
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const SERIES_HEX: Record<string, string> = {
  "--series-1": "#2a78d6",
  "--series-2": "#eb6834",
  "--series-3": "#1baf7a",
  "--series-4": "#eda100",
  "--series-5": "#e87ba4",
  "--series-6": "#008300",
  "--series-7": "#4a3aa7",
  "--series-8": "#e34948",
};
