import '../../global.css';

import * as Notifications from 'expo-notifications';
import { router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { setupNotifications } from '../lib/notifications';
import { C, navTheme } from '../lib/theme';

export default function RootLayout() {
  useEffect(() => {
    setupNotifications().catch(() => {});
    // Tapping a reminder opens the matching screen.
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.navigate(url as never);
    });
    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerTintColor: C.brand,
          headerStyle: { backgroundColor: C.bg },
          headerTitleStyle: { color: C.text, fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="question/new" options={{ presentation: 'modal', title: 'Add question', headerTintColor: C.dsa }} />
        <Stack.Screen name="question/[id]" options={{ title: 'Question', headerTintColor: C.dsa }} />
        <Stack.Screen name="topic/[id]" options={{ title: 'Topic', headerTintColor: C.topics }} />
        <Stack.Screen name="profile" options={{ title: 'Profile', headerTintColor: C.insights }} />
        <Stack.Screen name="workout-player" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
