import { connectDB } from "@/lib/db";
import MonthCycle from "@/models/MonthCycle";
import { endOfDay, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import type { z } from "zod";
import type { startCycleSchema } from "@/lib/validation/cycle";
import { appNow } from "@/lib/utils/dates";

export interface Period {
  start: Date;
  end: Date;
  // true when the period comes from a user-started home month rather than the calendar.
  isCustom: boolean;
}

/**
 * Returns the current period followed by up to `count - 1` previous ones, newest first.
 * The current period is the latest home month (open until the next one starts); older
 * periods are the preceding home months. Before the first home month — or when none
 * exist — periods fall back to month-long windows (calendar months when there are no cycles).
 */
export async function getRecentPeriods(count: number, now: Date = appNow()): Promise<Period[]> {
  await connectDB();
  const cycles = await MonthCycle.find({ startDate: { $lte: now } })
    .sort({ startDate: -1 })
    .limit(count)
    .lean();

  const periods: Period[] = [];
  if (cycles.length === 0) {
    periods.push({ start: startOfMonth(now), end: endOfMonth(now), isCustom: false });
  } else {
    periods.push({ start: cycles[0].startDate, end: endOfDay(now), isCustom: true });
    for (let i = 1; i < cycles.length && periods.length < count; i++) {
      periods.push({
        start: cycles[i].startDate,
        end: new Date(cycles[i - 1].startDate.getTime() - 1),
        isCustom: true,
      });
    }
  }

  while (periods.length < count) {
    const nextStart = periods[periods.length - 1].start;
    periods.push({
      start: subMonths(nextStart, 1),
      end: new Date(nextStart.getTime() - 1),
      isCustom: false,
    });
  }

  return periods;
}

/**
 * The period containing `date`: the home month it falls in, or — before the first home
 * month — its calendar month, cut short where the first home month begins.
 */
export async function getPeriodContaining(date: Date): Promise<Period> {
  await connectDB();
  const [cycle, next] = await Promise.all([
    MonthCycle.findOne({ startDate: { $lte: date } }).sort({ startDate: -1 }).lean(),
    MonthCycle.findOne({ startDate: { $gt: date } }).sort({ startDate: 1 }).lean(),
  ]);
  const nextStartEnd = next ? new Date(next.startDate.getTime() - 1) : null;

  if (cycle) {
    return { start: cycle.startDate, end: nextStartEnd ?? endOfDay(appNow()), isCustom: true };
  }
  const calendarEnd = endOfMonth(date);
  return {
    start: startOfMonth(date),
    end: nextStartEnd && nextStartEnd < calendarEnd ? nextStartEnd : calendarEnd,
    isCustom: false,
  };
}

// "September 2026" for a whole calendar month, "Sep 26 – Oct 25" otherwise.
export function periodLabel({ start, end }: Pick<Period, "start" | "end">): string {
  const isCalendarMonth = start.getDate() === 1 && isSameDay(end, endOfMonth(start));
  return isCalendarMonth ? format(start, "MMMM yyyy") : `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

// "Sep" for a calendar month, "Sep 26" for a home month that starts mid-month.
export function periodShortLabel({ start }: Pick<Period, "start">): string {
  return start.getDate() === 1 ? format(start, "MMM") : format(start, "MMM d");
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How long `current` is expected to last. A calendar month's length is known; a home month's
 * isn't until the next one starts, so estimate it from how long the `past` periods lasted.
 */
export function estimatedPeriodLengthMs(current: Period, past: Period[]): number {
  if (!current.isCustom) return current.end.getTime() - current.start.getTime();
  if (past.length === 0) return 30 * DAY_MS;
  return past.reduce((s, p) => s + (p.end.getTime() - p.start.getTime()), 0) / past.length;
}

export async function getCurrentPeriod(now: Date = appNow()) {
  const [current] = await getRecentPeriods(1, now);
  return current;
}

export async function listCycles() {
  await connectDB();
  return MonthCycle.find().sort({ startDate: -1 }).lean();
}

export async function startCycle(input: z.infer<typeof startCycleSchema>) {
  await connectDB();
  // A "yyyy-MM-dd" day parses to UTC midnight — the same boundary transaction dates use.
  const startDate = input.startDate ?? new Date(format(appNow(), "yyyy-MM-dd"));

  const latest = await MonthCycle.findOne().sort({ startDate: -1 }).lean();
  if (latest && startDate <= latest.startDate) {
    throw new Error("New month must start after the current one");
  }
  if (startDate > appNow()) {
    throw new Error("New month can't start in the future");
  }

  return MonthCycle.create({ startDate });
}

export async function deleteCycle(id: string) {
  await connectDB();
  await MonthCycle.findByIdAndDelete(id);
}
