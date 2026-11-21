import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'reminders';

/** Fixed daily schedule (local time). Weekday: 1 = Sunday. */
const REMINDERS: { title: string; body: string; url: string; hour: number; minute: number; weekday?: number }[] = [
  { title: '🏋️ Workout time', body: '10–15 min. Stretch first, then strength.', url: '/workout', hour: 7, minute: 0 },
  { title: '🧠 Today’s DSA plan is ready', body: 'Knock out your problems before the day gets busy.', url: '/', hour: 9, minute: 0 },
  { title: '🌙 Evening check-in', body: 'Finish today’s DSA and log a note on your topics.', url: '/', hour: 20, minute: 0 },
  { title: '📊 Weekly report is ready', body: 'See your weak patterns and next week’s focus.', url: '/insights', hour: 21, minute: 15, weekday: 1 },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Ask permission and (re)schedule all reminders. Safe to call on every launch. */
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

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of REMINDERS) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body, data: { url: r.url } },
      trigger:
        r.weekday !== undefined
          ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: r.weekday, hour: r.hour, minute: r.minute, channelId: CHANNEL }
          : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute, channelId: CHANNEL },
    });
  }
  return true;
}
