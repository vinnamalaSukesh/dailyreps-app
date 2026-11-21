import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';

import {
  Button, Card, Chip, ErrorBox, H2, Input, LevelBadge, Loading, Muted, RESULT_LABEL, Screen, TONE, type Tone,
} from '../../components/ui';
import { api } from '../../lib/api';
import { formatDay, localToday, relativeDay } from '../../lib/dates';
import type { AttemptResult } from '../../lib/types';
import { useApi } from '../../lib/useApi';

const INTERVALS = [1, 3, 7, 14, 30];
const RESULTS: AttemptResult[] = ['solved', 'solved_with_hint', 'failed'];
const RESULT_TONE: Record<AttemptResult, Tone> = { solved: 'emerald', solved_with_hint: 'amber', failed: 'rose' };

function Stat({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <View className={`flex-1 items-center rounded-2xl py-2 ${TONE[tone].soft}`}>
      <Text className={`text-base font-black ${TONE[tone].text}`}>{value}</Text>
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</Text>
    </View>
  );
}

export default function QuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: q, error, loading, reload } = useApi(() => api.question(id));
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [timeMin, setTimeMin] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const today = localToday();

  if (!q && loading) return <Loading />;
  if (!q) return <Screen><ErrorBox message={error ?? 'Not found'} onRetry={reload} /></Screen>;

  const loggedToday = q.attempts.find((a) => a.date === today);

  const submit = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await api.logAttempt(q.id, { result, timeMin: Number(timeMin) || 0, comment: comment.trim() });
      setResult(null); setTimeMin(''); setComment('');
      await reload();
    } catch (e) {
      Alert.alert('Could not log', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete question?', 'Its attempt history is deleted too.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.deleteQuestion(q.id); router.back(); } },
    ]);

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen options={{ title: q.lcNumber ? `#${q.lcNumber}` : 'Question' }} />
      <Card tone="violet">
        <Text className="text-xl font-bold text-white">{q.title}</Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <LevelBadge level={q.level} />
          <Text className="text-sm font-semibold text-violet-300">{q.pattern}</Text>
        </View>
        {q.tags.length ? <Muted>{q.tags.join(' · ')}</Muted> : null}
        <View className="flex-row gap-2">
          <Stat label="Interval" value={q.mastered ? '🏆' : `${INTERVALS[q.step]}d`} tone="cyan" />
          <Stat label="Fails" value={String(q.failCount)} tone="rose" />
          <Stat label="Next" value={q.nextRevisitAt ? relativeDay(q.nextRevisitAt, today) : '—'} tone="amber" />
        </View>
        {q.slug ? (
          <Button
            title="Open on LeetCode ↗"
            variant="secondary"
            tone="amber"
            onPress={() => Linking.openURL(`https://leetcode.com/problems/${q.slug}/`)}
          />
        ) : null}
      </Card>

      {loggedToday ? (
        <Card tone={RESULT_TONE[loggedToday.result]}>
          <H2 tone={RESULT_TONE[loggedToday.result]}>Logged today</H2>
          <Text className="text-base text-white">{RESULT_LABEL[loggedToday.result]} · {loggedToday.timeMin} min</Text>
          {loggedToday.comment ? <Muted>{loggedToday.comment}</Muted> : null}
        </Card>
      ) : (
        <Card>
          <H2 tone="violet">{q.attempts.length ? 'Log revisit' : 'Log first attempt'}</H2>
          <View className="flex-row flex-wrap gap-2">
            {RESULTS.map((r) => (
              <Chip key={r} label={RESULT_LABEL[r]} active={result === r} onPress={() => setResult(r)} tone={RESULT_TONE[r]} />
            ))}
          </View>
          <Input label="Time taken (min)" keyboardType="number-pad" value={timeMin} onChangeText={setTimeMin} placeholder="25" />
          <Input label="Comment" value={comment} onChangeText={setComment} multiline placeholder="What tripped you up? Key insight?" className="min-h-20" />
          <Button title="Mark done" tone="violet" onPress={submit} loading={saving} disabled={!result} />
        </Card>
      )}

      <Card>
        <H2 tone="cyan">History</H2>
        {q.attempts.length === 0 ? <Muted>No attempts yet.</Muted> : null}
        {q.attempts.map((a) => (
          <View key={a.id} className="flex-row gap-3 border-b border-white/10 pb-2">
            <View className={`mt-1.5 h-2.5 w-2.5 rounded-full ${TONE[RESULT_TONE[a.result]].dot}`} />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-slate-100">
                {formatDay(a.date)} · {a.type} · {RESULT_LABEL[a.result]} · {a.timeMin} min
              </Text>
              {a.comment ? <Muted>{a.comment}</Muted> : null}
            </View>
          </View>
        ))}
      </Card>

      <View className="gap-2">
        {!q.mastered ? (
          <Button
            title="🏆 Mark as mastered"
            variant="secondary"
            tone="emerald"
            onPress={async () => { await api.patchQuestion(q.id, { mastered: true }); reload(); }}
          />
        ) : null}
        <Button title="Delete question" variant="danger" onPress={remove} />
      </View>
    </Screen>
  );
}
