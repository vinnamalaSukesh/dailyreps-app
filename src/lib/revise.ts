import type { DateKey, Topic } from './types';

/** Days until the next revision for each step. Mirrors server/app/logic/revise.py. */
export const REVISE_INTERVALS = [1, 3, 7, 14, 30, 60];

/** Tagged and due on (or before) `day`. */
export function isDueOn(t: Topic, day: DateKey): boolean {
  return !!t.revision && t.revision.nextAt <= day;
}

export function revisedOn(t: Topic, day: DateKey): boolean {
  return t.revision?.lastAt === day;
}
