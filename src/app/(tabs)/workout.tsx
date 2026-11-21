import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Card, H2, Muted, Screen } from '../../components/ui';
import { ROUTINE, ROUTINE_NAME, totalSeconds } from '../../data/workout';
import { api } from '../../lib/api';
import { fromDateKey, localToday } from '../../lib/dates';
import { useApi } from '../../lib/useApi';

function Last14({ done }: { done: Set<string> }) {
  const today = fromDateKey(localToday());
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
  return (
    <View className="flex-row justify-between">
      {days.map((d) => (
        <View key={d} className={`h-5 w-5 rounded-md ${done.has(d) ? 'bg-emerald-400' : 'bg-white/10'}`} />
      ))}
    </View>
  );
}

export default function WorkoutScreen() {
  const { data: logs, loading, reload } = useApi(api.workoutLogs);
  const done = new Set((logs ?? []).filter((l) => l.completed).map((l) => l.date));
  const mins = Math.round(totalSeconds(ROUTINE) / 60);

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Card tone="emerald">
        <H2 tone="emerald" right={<Text className="font-bold text-emerald-300">~{mins} min</Text>}>{ROUTINE_NAME}</H2>
        <Button
          title={done.has(localToday()) ? '✅ Done today · go again' : '▶  Start workout'}
          tone="emerald"
          onPress={() => router.push('/workout-player')}
        />
      </Card>
      <Card>
        <H2 tone="emerald" right={<Text className="font-bold text-emerald-300">{done.size} days</Text>}>Last 14 days</H2>
        <Last14 done={done} />
      </Card>
      <Card>
        <H2 tone="amber" right={<Muted>{ROUTINE.length} exercises</Muted>}>Routine</H2>
        {ROUTINE.map((e, i) => (
          <View key={i} className="flex-row items-center gap-3 border-b border-white/10 pb-2">
            <Text className="w-5 text-center text-sm font-black text-emerald-300">{i + 1}</Text>
            <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white">
              {e.image ? <Image source={e.image} style={{ width: 48, height: 48 }} contentFit="contain" /> : <Text>🏃</Text>}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-white">{e.name}</Text>
              <Muted>{e.durationSec}s{e.restSec ? ` · rest ${e.restSec}s` : ''}</Muted>
            </View>
          </View>
        ))}
        <Muted>Edit the routine in src/data/workout.ts</Muted>
      </Card>
    </Screen>
  );
}
