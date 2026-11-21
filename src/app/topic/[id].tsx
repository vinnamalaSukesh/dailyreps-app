import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button, Card, ErrorBox, H2, Input, Loading, Muted, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDay } from '../../lib/dates';
import { CATEGORY_LABEL } from '../../lib/labels';
import { useApi } from '../../lib/useApi';

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
