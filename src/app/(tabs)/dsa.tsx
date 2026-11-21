import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Chip, ErrorBox, LEVEL_BAR, LevelBadge, Loading, Muted, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { localToday, relativeDay } from '../../lib/dates';
import type { Question } from '../../lib/types';
import { useApi } from '../../lib/useApi';

type Filter = 'due' | 'backlog' | 'learning' | 'mastered' | 'all';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'due', label: 'Due' },
  { key: 'backlog', label: 'Not started' },
  { key: 'learning', label: 'Learning' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'all', label: 'All' },
];

function matches(q: Question, f: Filter, today: string) {
  switch (f) {
    case 'due': return !q.mastered && !!q.nextRevisitAt && q.nextRevisitAt <= today;
    case 'backlog': return !q.lastAttemptAt && !q.mastered;
    case 'learning': return !!q.lastAttemptAt && !q.mastered;
    case 'mastered': return q.mastered;
    default: return true;
  }
}

export default function DsaScreen() {
  const { data, error, loading, reload } = useApi(api.questions);
  const [filter, setFilter] = useState<Filter>('due');
  const today = localToday();

  const list = useMemo(() => (data ?? []).filter((q) => matches(q, filter, today)), [data, filter, today]);
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, (data ?? []).filter((q) => matches(q, f.key, today)).length])),
    [data, today],
  );

  if (!data && loading) return <Loading />;
  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Button title="+ Add question" tone="violet" onPress={() => router.push('/question/new')} />
      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} label={`${f.label} ${counts[f.key] ?? 0}`} active={filter === f.key} onPress={() => setFilter(f.key)} tone="violet" />
        ))}
      </View>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {list.length === 0 && !loading ? <Muted>Nothing here.</Muted> : null}
      {list.map((q) => (
        <Pressable
          key={q.id}
          onPress={() => router.push(`/question/${q.id}`)}
          className="overflow-hidden rounded-2xl bg-ink-850 border border-white/10 p-4 pl-5 gap-1 active:opacity-70"
        >
          <View className={`absolute bottom-0 left-0 top-0 w-1.5 ${LEVEL_BAR[q.level]}`} />
          <Text className="font-semibold text-white">{q.lcNumber ? `${q.lcNumber}. ` : ''}{q.title}</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <LevelBadge level={q.level} />
            <Text className="text-xs text-slate-400">{q.pattern}</Text>
            {q.failCount ? <Text className="text-xs text-rose-400">✗ {q.failCount}</Text> : null}
            {q.nextRevisitAt && !q.mastered ? (
              <Text className="text-xs text-slate-400">· revisit {relativeDay(q.nextRevisitAt, today)}</Text>
            ) : null}
            {q.mastered ? <Text className="text-xs text-emerald-300">· mastered</Text> : null}
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
