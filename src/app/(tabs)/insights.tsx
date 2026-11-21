import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button, Card, ErrorBox, H2, LevelBadge, Loading, Muted, Screen, TONE, type Tone } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDay } from '../../lib/dates';
import { CATEGORY_LABEL } from '../../lib/labels';
import type { Report, SuggestedTopic, TopicCategory } from '../../lib/types';
import { useApi } from '../../lib/useApi';

const CATEGORY_TONE: Record<TopicCategory, Tone> = { system_design: 'violet', devops: 'cyan', other: 'pink' };

function Label({ children, tone }: { children: string; tone: Tone }) {
  return <Text className={`text-xs font-black uppercase tracking-widest ${TONE[tone].text}`}>{children}</Text>;
}

function WeakPatterns({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View className="gap-2">
      <Label tone="rose">Weak patterns</Label>
      <View className="flex-row flex-wrap gap-2">
        {items.map((p) => (
          <Text key={p} className="rounded-full bg-rose-500/15 px-3 py-1 text-sm font-semibold text-rose-300">{p}</Text>
        ))}
      </View>
    </View>
  );
}

function Focus({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View className="gap-1.5">
      <Label tone="emerald">Focus next week</Label>
      {items.map((t, i) => (
        <View key={i} className="flex-row gap-2">
          <Text className="font-black text-emerald-300">{i + 1}.</Text>
          <Text className="flex-1 text-sm text-slate-200">{t}</Text>
        </View>
      ))}
    </View>
  );
}

function TopicSuggestions({ items }: { items: Report['suggestedTopics'] }) {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const topics: SuggestedTopic[] = items.map((t) => (typeof t === 'string' ? { title: t, category: 'other', why: '' } : t));
  if (!topics.length) return null;

  const add = async (t: SuggestedTopic) => {
    try {
      await api.addTopic(t.title, t.category);
      setAdded((s) => new Set(s).add(t.title));
    } catch (e) {
      Alert.alert('Could not add', (e as Error).message);
    }
  };

  return (
    <View className="gap-2">
      <Label tone="cyan">Study next</Label>
      {topics.map((t) => {
        const tone = CATEGORY_TONE[t.category] ?? 'pink';
        return (
          <View key={t.title} className={`flex-row items-center gap-2 rounded-2xl border p-3 ${TONE[tone].card}`}>
            <View className="flex-1 gap-1">
              <Text className={`text-[10px] font-black uppercase tracking-widest ${TONE[tone].text}`}>{CATEGORY_LABEL[t.category]}</Text>
              <Text className="text-sm font-bold text-white">{t.title}</Text>
              {t.why ? <Text className="text-xs text-slate-400">{t.why}</Text> : null}
            </View>
            {added.has(t.title) ? (
              <Text className="text-sm font-bold text-emerald-300">✓ Added</Text>
            ) : (
              <Button title="+ Topic" variant="secondary" tone={tone} onPress={() => add(t)} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function ReportCard({ r, onAdded }: { r: Report; onAdded: () => void }) {
  const add = async (slug: string) => {
    try {
      await api.addQuestion({ ref: slug });
      Alert.alert('Added', 'It will show up in your new-question queue.');
      onAdded();
    } catch (e) {
      Alert.alert('Could not add', (e as Error).message);
    }
  };
  return (
    <Card>
      <H2
        tone="amber"
        right={
          <Text className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300">
            {r.trigger === 'weekly' ? 'weekly' : 'on demand'} · {r.source}
          </Text>
        }
      >
        {formatDay(r.createdOn)}
      </H2>
      <Text className="text-[15px] leading-6 text-slate-100">{r.summary}</Text>
      <WeakPatterns items={r.weakPatterns} />
      <Focus items={r.focusNextWeek} />
      <TopicSuggestions items={r.suggestedTopics} />
      {r.suggestedQuestions.length ? (
        <View className="gap-2">
          <Label tone="violet">Suggested problems</Label>
          {r.suggestedQuestions.map((q) => (
            <View key={q.slug} className="flex-row items-center gap-2 rounded-2xl bg-ink-800 p-3">
              <View className="flex-1 gap-1">
                <Text className="text-sm font-semibold text-white">{q.lcNumber}. {q.title}</Text>
                <LevelBadge level={q.level} />
              </View>
              <Button title="+ Add" variant="secondary" tone="violet" onPress={() => add(q.slug)} />
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export default function InsightsScreen() {
  const { data, error, loading, reload } = useApi(api.reports);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      await api.analyzeNow();
      await reload();
    } catch (e) {
      Alert.alert('Analyze failed', (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!data && loading) return <Loading />;
  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Card tone="amber">
        <H2 tone="amber">AI coach</H2>
        <Muted>A weekly report is generated every Sunday at 9 PM. You can also run one now (limited per day).</Muted>
        <Button title="🤖  Analyze now" tone="amber" onPress={analyze} loading={analyzing} />
        <Button title="Edit profile (helps the AI)" variant="secondary" tone="amber" onPress={() => router.push('/profile')} />
      </Card>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {data?.length === 0 ? <Muted>No reports yet.</Muted> : null}
      {data?.map((r) => <ReportCard key={r.id} r={r} onAdded={reload} />)}
    </Screen>
  );
}
