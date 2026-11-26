import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button, Card, ErrorBox, H2, Input, Loading, Muted, Screen, TONE, type Tone } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDay, localToday, relativeDay } from '../../lib/dates';
import { CATEGORY_LABEL } from '../../lib/labels';
import { isDueOn, REVISE_INTERVALS, revisedOn } from '../../lib/revise';
import type { Topic } from '../../lib/types';
import { useApi } from '../../lib/useApi';

function Stat({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <View className={`flex-1 items-center rounded-2xl py-2 ${TONE[tone].soft}`}>
      <Text className={`text-base font-black ${TONE[tone].text}`}>{value}</Text>
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</Text>
    </View>
  );
}

function RevisionCard({ t, busy, onTag, onReview }: {
  t: Topic; busy: boolean; onTag: (on: boolean) => void; onReview: (correct: boolean) => void;
}) {
  const today = localToday();
  const rev = t.revision;
  const reviews = t.reviews ?? [];

  if (!rev) {
    return (
      <Card tone="amber">
        <H2 tone="amber">Revision</H2>
        <Muted>
          Tag this topic and you&apos;ll get reminders to revise it after {REVISE_INTERVALS.join(', ')} days. Each time,
          explain it without notes and mark whether you got it right.
        </Muted>
        <Button title="🔁 Revise this topic" tone="amber" onPress={() => onTag(true)} loading={busy} />
        {reviews.length ? <Muted>{reviews.length} past revisions kept below.</Muted> : null}
        <ReviewHistory reviews={reviews} />
      </Card>
    );
  }

  const last = reviews[reviews.length - 1];
  return (
    <Card tone="amber">
      <H2 tone="amber">🔁 Revision</H2>
      <View className="flex-row gap-2">
        <Stat label="Interval" value={`${REVISE_INTERVALS[rev.step]}d`} tone="cyan" />
        <Stat label="Correct" value={String(rev.correct)} tone="emerald" />
        <Stat label="Wrong" value={String(rev.wrong)} tone="rose" />
        <Stat label="Next" value={relativeDay(rev.nextAt, today)} tone="amber" />
      </View>
      {revisedOn(t, today) && last ? (
        <Text className="text-base text-white">
          Revised today: {last.correct ? '✅ correct' : '❌ wrong'}. Next one {relativeDay(rev.nextAt, today)}.
        </Text>
      ) : isDueOn(t, today) ? (
        <>
          <Text className="text-base font-semibold text-white">
            Explain it out loud without looking at your notes. Did you get it right?
          </Text>
          <View className="flex-row gap-2">
            <Button title="✅ Correct" tone="emerald" onPress={() => onReview(true)} disabled={busy} className="flex-1" />
            <Button title="❌ Wrong" variant="secondary" tone="rose" onPress={() => onReview(false)} disabled={busy} className="flex-1" />
          </View>
        </>
      ) : (
        <Muted>Not due yet. You&apos;ll get a reminder on {formatDay(rev.nextAt)}.</Muted>
      )}
      <ReviewHistory reviews={reviews} />
      <Button title="Stop revising" variant="ghost" onPress={() => onTag(false)} disabled={busy} />
    </Card>
  );
}

function ReviewHistory({ reviews }: { reviews: NonNullable<Topic['reviews']> }) {
  if (!reviews.length) return null;
  return (
    <View className="gap-1">
      {[...reviews].reverse().slice(0, 10).map((r, i) => (
        <View key={i} className="flex-row items-center gap-2">
          <View className={`h-2.5 w-2.5 rounded-full ${r.correct ? TONE.emerald.dot : TONE.rose.dot}`} />
          <Text className="text-sm text-slate-200">{formatDay(r.date)} · {r.correct ? 'correct' : 'wrong'}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: t, error, loading, reload, setData } = useApi(() => api.topic(id));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!t && loading) return <Loading />;
  if (!t) return <Screen><ErrorBox message={error ?? 'Not found'} onRetry={reload} /></Screen>;

  const run = async (fn: () => Promise<typeof t>) => {
    setBusy(true);
    try {
      setData(await fn());
    } catch (e) {
      Alert.alert('Failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addNote = () => note.trim() && run(async () => { const r = await api.commentTopic(t.id, note.trim()); setNote(''); return r; });
  const toggle = () => run(() => api.patchTopic(t.id, { status: t.status === 'pending' ? 'completed' : 'pending' }));
  const tag = (on: boolean) => run(() => api.patchTopic(t.id, { revise: on }));
  const review = (correct: boolean) => run(() => api.reviewTopic(t.id, correct));
  const remove = () =>
    Alert.alert('Delete topic?', t.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.deleteTopic(t.id); router.back(); } },
    ]);

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen options={{ title: CATEGORY_LABEL[t.category] }} />
      <Card tone={t.status === 'pending' ? 'cyan' : 'emerald'}>
        <Text className="text-xl font-bold text-white">{t.title}</Text>
        <Muted>
          Added {formatDay(t.createdAt)} · {t.status === 'pending' ? '⏳ in progress' : `✅ completed ${t.completedAt ? formatDay(t.completedAt) : ''}`}
        </Muted>
        <Button
          title={t.status === 'pending' ? 'Mark completed' : 'Reopen (pending)'}
          variant={t.status === 'pending' ? 'primary' : 'secondary'}
          tone="emerald"
          onPress={toggle}
          disabled={busy}
        />
      </Card>
      <RevisionCard t={t} busy={busy} onTag={tag} onReview={review} />
      <Card>
        <H2 tone="cyan">Notes</H2>
        <Input value={note} onChangeText={setNote} placeholder="What did you cover today?" multiline className="min-h-16" />
        <Button title="Add note" variant="secondary" tone="cyan" onPress={addNote} disabled={!note.trim()} loading={busy} />
        {[...t.comments].reverse().map((c, i) => (
          <View key={i} className="gap-0.5 border-b border-white/10 pb-2">
            <Text className="text-xs font-bold text-cyan-300">{formatDay(c.date)}</Text>
            <Text className="text-slate-100">{c.text}</Text>
          </View>
        ))}
        {t.comments.length === 0 ? <Muted>No notes yet.</Muted> : null}
      </Card>
      <Button title="Delete topic" variant="danger" onPress={remove} />
    </Screen>
  );
}
