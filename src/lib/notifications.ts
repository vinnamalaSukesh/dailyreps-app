import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, fromDateKey, localToday } from './dates';
import { isDueOn, revisedOn } from './revise';
import type { DateKey, Objective, Today } from './types';

const CHANNEL = 'reminders';
/** One-off reminders are scheduled this far ahead, so they keep coming even if the app isn't opened for a while. */
const DAYS_AHEAD = 14;

type Reminder = { title: string; body: string; url: string; hour: number; minute: number };

const WORKOUT: Reminder = { title: '🏋️ Workout time', body: '10–15 min. Stretch first, then strength.', url: '/workout', hour: 7, minute: 0 };
const DSA: Reminder = { title: '🧠 Today’s DSA plan is ready', body: 'Knock out your problems before the day gets busy.', url: '/', hour: 9, minute: 0 };
const EVENING: Reminder = { title: '🌙 Evening check-in', body: 'Finish today’s DSA and log a note on your topics.', url: '/', hour: 20, minute: 0 };
const REPORT: Reminder = { title: '📊 Weekly report is ready', body: 'See your weak patterns and next week’s focus.', url: '/insights', hour: 21, minute: 15 };
const REVISE: Reminder = { title: '🔁 Revision time', body: '', url: '/', hour: 13, minute: 0 };

/** Topics to revise on `day`, judged from their current due dates. Empty without data. */
function reviseReminder(day: DateKey, t: Today | null): Reminder[] {
  const due = (t?.revisionTopics ?? []).filter((tp) => isDueOn(tp, day) && !(day === t?.date && revisedOn(tp, day)));
  if (!due.length) return [];
  const names = due.map((tp) => tp.title);
  return [{
    ...REVISE,
    body: `${names.length === 1 ? '1 topic' : `${names.length} topics`}: ${names.join(', ')}. Explain each without notes.`,
  }];
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const OBJ_LABEL: Record<Objective, string> = { dsa: 'DSA', topics: 'a topic note', workout: 'workout' };

/** What's still open today: not done and no skip reason logged. */
function openToday(t: Today): Objective[] {
  const dsaLeft = t.plan.items.some((i) => !i.attempt);
  const done: Record<Objective, boolean> = {
    // Older servers don't send doneToday; fall back to what /today already tells us.
    dsa: t.streaks.dsa.doneToday ?? !dsaLeft,
    topics: t.streaks.topics.doneToday ?? false,
    workout: t.workoutDone,
  };
  return (['dsa', 'topics', 'workout'] as const).filter((o) => !done[o] && !t.misses?.[o]);
}

/** Today's reminders tailored to what's left; null today = no info, use the generic ones. */
function remindersFor(day: DateKey, t: Today | null): Reminder[] {
  const isSunday = fromDateKey(day).getDay() === 0;
  const report = isSunday ? [REPORT] : [];
  const revise = reviseReminder(day, t);
  if (!t || t.date !== day) return [WORKOUT, DSA, ...revise, EVENING, ...report];

  const open = openToday(t);
  const out: Reminder[] = [];
  if (open.includes('workout')) out.push(WORKOUT);

  const left = t.plan.items.filter((i) => !i.attempt).map((i) => i.question.title);
  if (open.includes('dsa') && left.length) {
    out.push({ ...DSA, body: `${left.length === 1 ? '1 revisit' : `${left.length} revisits`}: ${left.join(', ')}` });
  }
  out.push(...revise);

  if (open.length) {
    const parts = open.map((o) => (o === 'dsa' && left.length ? `${left.length} revisit${left.length > 1 ? 's' : ''}` : OBJ_LABEL[o]));
    const streak = Math.max(...open.map((o) => t.streaks[o].current));
    out.push({
      ...EVENING,
      body: `Still open: ${parts.join(', ')}.${streak > 1 ? ` Keep your ${streak}-day streak going.` : ''} Can't today? Log a reason.`,
    });
  }
  return [...out, ...report];
}

async function permitted(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).status === 'granted';
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Replace all scheduled reminders with one-off ones for the next DAYS_AHEAD days.
 * Pass today's data to drop reminders for things already done (or skipped with a reason).
 * Calls are serialized so overlapping syncs can't leave duplicates.
 */
export function syncReminders(t: Today | null = null): Promise<unknown> {
  queue = queue.then(async () => {
    if (!(await permitted())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = Date.now();
    const today = localToday();
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const day = addDays(today, i);
      for (const r of remindersFor(day, t)) {
        const at = fromDateKey(day);
        at.setHours(r.hour, r.minute, 0, 0);
        if (at.getTime() <= now) continue;
        await Notifications.scheduleNotificationAsync({
          content: { title: r.title, body: r.body, data: { url: r.url } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
        });
      }
    }
  }).catch(() => {});
  return queue;
}

/** Create the channel, ask permission, and schedule generic reminders. Safe to call on every launch. */
export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 13+ only shows the permission prompt once a channel exists.
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  const status = existing === 'granted' ? existing : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return false;
  // Only fill in generic reminders if nothing is scheduled; the Today screen replaces them with tailored ones.
  if ((await Notifications.getAllScheduledNotificationsAsync()).length === 0) await syncReminders();
  return true;
}
