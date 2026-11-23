import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import {
  Button, Card, ErrorBox, H2, LEVEL_BAR, LevelBadge, Loading, Muted, RESULT_LABEL, Screen, TONE, type Tone,
} from '../../components/ui';
import { MissReason } from '../../components/MissReason';
import { api } from '../../lib/api';
import { formatDay } from '../../lib/dates';
import type { Streak, Today } from '../../lib/types';
import { useApi } from '../../lib/useApi';

function StreakTile({ label, emoji, s, tone }: { label: string; emoji: string; s: Streak; tone: Tone }) {
  return (
    <View className={`flex-1 items-center rounded-3xl border py-3 ${TONE[tone].card}`}>
      <Text className="text-lg">{emoji}</Text>
      <Text className={`text-3xl font-black ${TONE[tone].text}`}>{s.current}</Text>
      <Text className="text-xs font-bold text-slate-200">{label}</Text>
      <Text className="text-[10px] text-slate-400">best {s.best}</Text>
    </View>
  );
}

function ProgressBar({ value, tone }: { value: number; tone: Tone }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-white/10">
      <View className={`h-full rounded-full ${TONE[tone].solid}`} style={{ width: `${Math.round(value * 100)}%` }} />
    </View>
  );
}

function DsaCard({ t, onSeed, seeding, reload }: { t: Today; onSeed: () => void; seeding: boolean; reload: () => void }) {
  const items = t.plan.items;
  const done = items.filter((i) => i.attempt).length;
  return (
    <Card tone="violet">
      <H2 tone="violet" right={<Text className="text-sm font-bold text-violet-300">{done}/{items.length}</Text>}>
        {t.weekend ? 'DSA · weekend revisits' : 'DSA · today'}
      </H2>
      {items.length ? <ProgressBar value={items.length ? done / items.length : 0} tone="violet" /> : null}
      {items.map(({ kind, question: q, attempt }) => (
        <Pressable
          key={q.id}
          onPress={() => router.push(`/question/${q.id}`)}
          className="flex-row items-center gap-3 overflow-hidden rounded-2xl bg-ink-800 p-3 active:opacity-70"
        >
          <View className={`absolute bottom-0 left-0 top-0 w-1 ${LEVEL_BAR[q.level]}`} />
          <View className={`h-6 w-6 items-center justify-center rounded-lg border-2 ${attempt ? 'border-violet-400 bg-violet-500' : 'border-slate-500'}`}>
            {attempt ? <Text className="text-xs font-black text-white">✓</Text> : null}
          </View>
          <View className="flex-1 gap-1">
            <Text className={`font-semibold ${attempt ? 'text-slate-500 line-through' : 'text-white'}`}>
              {q.lcNumber ? `${q.lcNumber}. ` : ''}{q.title}
            </Text>
            <View className="flex-row flex-wrap items-center gap-2">
              <LevelBadge level={q.level} />
              <Text className={`text-xs font-semibold ${kind === 'new' ? 'text-pink-300' : 'text-cyan-300'}`}>
                {kind === 'new' ? '🆕 new' : '🔁 revisit'}
              </Text>
              <Text className="text-xs text-slate-400">{q.pattern}</Text>
              {attempt ? <Text className="text-xs text-slate-400">{RESULT_LABEL[attempt.result]}</Text> : null}
            </View>
          </View>
        </Pressable>
      ))}
      {items.length === 0 ? (
        t.backlogCount === 0 ? (
          <View className="gap-2">
            <Muted>No questions yet. Add your own, or load a starter list of 46 classic problems.</Muted>
            <Button title="Load starter list" tone="violet" onPress={onSeed} loading={seeding} />
            <Button title="Add a question" variant="secondary" tone="violet" onPress={() => router.push('/question/new')} />
          </View>
        ) : (
          <Muted>Nothing due today 🎉</Muted>
        )
      ) : null}
      {t.plan.aiReason ? (
        <View className="rounded-2xl bg-violet-500/10 p-3">
          <Text className="text-sm text-violet-200">🤖 {t.plan.aiReason}</Text>
        </View>
      ) : null}
      {!t.weekend && t.backlogCount < 3 && items.length > 0 ? (
        <Muted>Only {t.backlogCount} new questions left. Add more in the DSA tab.</Muted>
      ) : null}
      {done < items.length || t.misses?.dsa ? (
        <MissReason objective="dsa" today={t.date} reason={t.misses?.dsa} tone="violet" onChange={reload} />
      ) : null}
    </Card>
  );
}

export default function TodayScreen() {
  const { data: t, error, loading, reload } = useApi(api.today);
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try {
      const { added } = await api.seed();
      Alert.alert('Starter list loaded', `${added} questions added.`);
      await reload();
    } catch (e) {
      Alert.alert('Failed', String((e as Error).message));
    } finally {
      setSeeding(false);
    }
  };

  if (!t && loading) return <Loading />;
  return (
    <Screen refreshing={loading} onRefresh={reload}>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {t ? (
        <>
          <Text className="text-sm font-semibold uppercase tracking-widest text-pink-300">{formatDay(t.date)}</Text>
          <View className="flex-row gap-3">
            <StreakTile label="DSA" emoji="🧠" s={t.streaks.dsa} tone="violet" />
            <StreakTile label="Topics" emoji="📚" s={t.streaks.topics} tone="cyan" />
            <StreakTile label="Workout" emoji="🏋️" s={t.streaks.workout} tone="emerald" />
          </View>

          <DsaCard t={t} onSeed={seed} seeding={seeding} reload={reload} />

          <Card tone="cyan">
            <H2 tone="cyan" right={<Button title="+ Add" variant="ghost" onPress={() => router.navigate('/topics')} className="py-1" />}>
              Topics in progress
            </H2>
            {t.pendingTopics.length === 0 ? <Muted>No pending topics.</Muted> : null}
            {t.pendingTopics.map((tp) => (
              <Pressable key={tp.id} onPress={() => router.push(`/topic/${tp.id}`)} className="rounded-2xl bg-ink-800 p-3 active:opacity-70">
                <Text className="font-semibold text-white">{tp.title}</Text>
                <Muted>
                  {tp.comments.length ? `Last note: ${tp.comments[tp.comments.length - 1].text}` : 'No notes yet. Tap to add one.'}
                </Muted>
              </Pressable>
            ))}
            <MissReason objective="topics" today={t.date} reason={t.misses?.topics} tone="cyan" onChange={reload} />
          </Card>

          <Card tone="emerald">
            <H2 tone="emerald">Workout</H2>
            {t.workoutDone ? (
              <Text className="text-base font-bold text-emerald-300">✅ Done for today</Text>
            ) : (
              <Button title="▶  Start workout" tone="emerald" onPress={() => router.push('/workout-player')} />
            )}
            {!t.workoutDone || t.misses?.workout ? (
              <MissReason objective="workout" today={t.date} reason={t.misses?.workout} tone="emerald" onChange={reload} />
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
