import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button, Card, Chip, ErrorBox, H2, Input, Loading, Muted, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDay, localToday, relativeDay } from '../../lib/dates';
import { CATEGORY_LABEL } from '../../lib/labels';
import { isDueOn } from '../../lib/revise';
import type { Topic, TopicCategory } from '../../lib/types';
import { useApi } from '../../lib/useApi';

function TopicRow({ t }: { t: Topic }) {
  const last = t.comments[t.comments.length - 1];
  const today = localToday();
  return (
    <Pressable onPress={() => router.push(`/topic/${t.id}`)} className="rounded-2xl bg-ink-800 p-3 gap-1 active:opacity-70">
      <Text className={`font-semibold ${t.status === 'completed' ? 'text-slate-500' : 'text-white'}`}>
        {t.status === 'completed' ? '✅ ' : '⏳ '}{t.title}
      </Text>
      {t.revision ? (
        <Text className={`text-xs font-bold ${isDueOn(t, today) ? 'text-amber-300' : 'text-slate-400'}`}>
          🔁 {isDueOn(t, today) ? 'revise today' : `revise ${relativeDay(t.revision.nextAt, today)}`}
        </Text>
      ) : null}
      <Muted>
        {CATEGORY_LABEL[t.category]}
        {t.status === 'completed' && t.completedAt ? ` · done ${formatDay(t.completedAt)}` : ''}
        {last ? ` · ${last.text}` : ''}
      </Muted>
    </Pressable>
  );
}

export default function TopicsScreen() {
  const { data, error, loading, reload } = useApi(api.topics);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TopicCategory>('system_design');
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.addTopic(title.trim(), category);
      setTitle('');
      await reload();
    } catch (e) {
      Alert.alert('Could not add', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!data && loading) return <Loading />;
  const pending = (data ?? []).filter((t) => t.status === 'pending');
  const done = (data ?? []).filter((t) => t.status === 'completed');

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Card tone="cyan">
        <Input placeholder="New topic, e.g. Rate limiter design" value={title} onChangeText={setTitle} onSubmitEditing={add} />
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABEL) as TopicCategory[]).map((c) => (
            <Chip key={c} label={CATEGORY_LABEL[c]} active={category === c} onPress={() => setCategory(c)} tone="cyan" />
          ))}
        </View>
        <Button title="Add topic" tone="cyan" onPress={add} loading={saving} disabled={!title.trim()} />
      </Card>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      <Card>
        <H2 tone="cyan" right={<Text className="font-bold text-cyan-300">{pending.length}</Text>}>In progress</H2>
        {pending.length === 0 ? <Muted>Nothing pending.</Muted> : pending.map((t) => <TopicRow key={t.id} t={t} />)}
      </Card>
      {done.length ? (
        <Card>
          <H2 tone="emerald" right={<Text className="font-bold text-emerald-300">{done.length}</Text>}>Completed</H2>
          {done.map((t) => <TopicRow key={t.id} t={t} />)}
        </Card>
      ) : null}
    </Screen>
  );
}
