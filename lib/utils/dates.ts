import { addMonths, getDaysInMonth, startOfDay, startOfMonth, endOfMonth, format, subMonths } from "date-fns";

export const APP_TIME_ZONE = process.env.APP_TIME_ZONE ?? "Africa/Cairo";

/**
 * The user's current wall-clock time, expressed in UTC fields.
 *
 * Transactions store their day as UTC midnight ("2026-10-01" -> 2026-10-01T00:00Z) and the
 * server runs in UTC, so "today" and "this month" must come from the user's clock, not the
 * server's — otherwise from midnight to 3 AM in Cairo the server is still on yesterday.
 */
export function appNow(): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return new Date(
    Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  );
}

/**
 * The first date on or after `periodStart` that falls on `day` of its month (clamped to the
 * month's length, so day 31 lands on Feb 28). A bill due on the 5th inside a home month that
 * starts on Sep 26 is due Oct 5, not "overdue since Sep 5".
 */
export function dueDateInPeriod(day: number, periodStart: Date): Date {
  const onDay = (month: Date) => new Date(month.getFullYear(), month.getMonth(), Math.min(day, getDaysInMonth(month)));
  const candidate = onDay(periodStart);
  return candidate >= startOfDay(periodStart) ? candidate : onDay(addMonths(startOfMonth(periodStart), 1));
}

export function monthKey(date: Date = appNow()): string {
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

// Reads an optional `from`/`to` pair of ISO dates off a query string; both must be valid.
export function rangeFromParams(params: URLSearchParams): { start: Date; end: Date } | undefined {
  const from = params.get("from");
  const to = params.get("to");
  if (!from || !to) return undefined;
  const start = new Date(from);
  const end = new Date(to);
  return isNaN(start.getTime()) || isNaN(end.getTime()) || start > end ? undefined : { start, end };
}
