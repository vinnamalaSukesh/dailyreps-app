import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

import { C } from '../../lib/theme';

/** Emoji icon with a coloured glow pill when focused. */
const icon = (emoji: string, color: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return (
      <View
        style={{
          width: 52,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? `${color}33` : 'transparent',
        }}
      >
        <Text style={{ fontSize: 20, lineHeight: 26, textAlign: 'center', opacity: focused ? 1 : 0.6 }} allowFontScaling={false}>
          {emoji}
        </Text>
      </View>
    );
  };

const tab = (title: string, emoji: string, color: string) => ({
  title,
  tabBarIcon: icon(emoji, color),
  tabBarActiveTintColor: color,
  headerTitleStyle: { color, fontWeight: '800' as const, fontSize: 22 },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.bg },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        sceneStyle: { backgroundColor: C.bg },
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border },
        // Default icon slot is ~25px wide, which clips the emoji + pill.
        tabBarIconStyle: { width: 52, height: 30 },
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={tab('Today', '🔥', C.today)} />
      <Tabs.Screen name="dsa" options={tab('DSA', '🧠', C.dsa)} />
      <Tabs.Screen name="topics" options={tab('Topics', '📚', C.topics)} />
      <Tabs.Screen name="workout" options={tab('Workout', '🏋️', C.workout)} />
      <Tabs.Screen name="insights" options={tab('Insights', '📊', C.insights)} />
    </Tabs>
  );
}
