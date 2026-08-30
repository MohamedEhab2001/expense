import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

export function monthKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM");
}

export function monthRange(key: string): { start: Date; end: Date } {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return { start: startOfMonth(d), end: endOfMonth(d) };
}

export function previousMonthKey(key: string): string {
  const { start } = monthRange(key);
  return monthKey(subMonths(start, 1));
}
