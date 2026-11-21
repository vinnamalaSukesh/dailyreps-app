import type { DateKey } from './types';

/** Parse "YYYY-MM-DD" at local noon so DST shifts never move the day. */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function formatDay(key: DateKey): string {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "today", "tomorrow", "in 3 days", "2 days ago" relative to `today`. */
export function relativeDay(key: DateKey, today: DateKey): string {
  const days = Math.round((fromDateKey(key).getTime() - fromDateKey(today).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

export function localToday(): DateKey {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
