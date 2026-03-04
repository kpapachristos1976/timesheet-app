import { differenceInBusinessDays, parseISO, isValid, format, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function getWorkingDays(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  if (!isValid(start) || !isValid(end)) return 0;
  
  return differenceInBusinessDays(end, start) + 1;
}

export function calculatePlannedHours(
  startDate: string,
  endDate: string,
  allocationPercentage: number
): number {
  const workingDays = getWorkingDays(startDate, endDate);
  return workingDays * 8 * (allocationPercentage / 100);
}

export function formatDate(date: string): string {
  const parsed = parseISO(date);
  if (!isValid(parsed)) return date;
  return format(parsed, 'yyyy-MM-dd');
}

export function getTimelinePeriods(
  startDate: string,
  endDate: string,
  granularity: 'weekly' | 'monthly'
): { start: Date; end: Date; label: string }[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (!isValid(start) || !isValid(end)) return [];

  if (granularity === 'weekly') {
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    return weeks.map((weekStart) => ({
      start: startOfWeek(weekStart, { weekStartsOn: 1 }),
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
      label: format(weekStart, 'MMM dd'),
    }));
  } else {
    const months = eachMonthOfInterval({ start, end });
    return months.map((monthStart) => ({
      start: startOfMonth(monthStart),
      end: endOfMonth(monthStart),
      label: format(monthStart, 'MMM yyyy'),
    }));
  }
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export function doRangesOverlap(
  range1Start: Date,
  range1End: Date,
  range2Start: Date,
  range2End: Date
): boolean {
  return range1Start <= range2End && range1End >= range2Start;
}
