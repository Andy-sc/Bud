const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return { year: newYear, month: newMonth };
}

export function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = shiftMonth(year, month, 1);
  const end = `${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01`;
  return { start, end };
}
