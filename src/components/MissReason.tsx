import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../lib/api';
import { addDays } from '../lib/dates';
import type { DateKey, Objective } from '../lib/types';
import { Button, Chip, Input, Muted, TONE, type Tone } from './ui';

const LABEL: Record<Objective, string> = { dsa: 'DSA', topics: 'topics', workout: 'the workout' };

/**
 * "Couldn't do it?" for one objective: shows today's logged reason, or a link that opens a sheet
 * with suggested reasons. Can also log a reason for yesterday.
 */
export function MissReason({
  objective, today, reason, tone, onChange, excuseLeft,
}: { objective: Objective; today: DateKey; reason?: string; tone: Tone; onChange: () => void; excuseLeft?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [day, setDay] = useState<'today' | 'yesterday'>('today');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  const show = () => {
    setText(reason ?? '');
    setDay('today');
    setOpen(true);
    api.missSuggestions().then((s) => setSuggestions(s[objective])).catch(() => setSuggestions([]));
  };

  const run = async (fn: () => Promise<unknown>, after?: string) => {
    setBusy(true);
    try {
      await fn();
      setOpen(false);
      onChange();
      if (after) Alert.alert('Saved', after);
    } catch (e) {
      Alert.alert('Failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const date = day === 'today' ? today : addDays(today, -1);
  const save = () =>
    run(() => api.saveMiss({ objective, reason: text.trim(), date }), day === 'yesterday' ? 'Reason saved for yesterday.' : undefined);
  const clear = () => run(() => api.deleteMiss(today, objective));

  return (
    <>
      {reason ? (
        <Pressable onPress={show} className="flex-row items-start gap-2 rounded-2xl bg-amber-500/10 p-3 active:opacity-70">
          <Text>⚠️</Text>
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase text-amber-300">Skipped today</Text>
            <Text className="text-amber-100">{reason}</Text>
          </View>
          <Text className="text-xs font-bold text-amber-300">Edit</Text>
        </Pressable>
      ) : (
        <Pressable onPress={show} className="self-start py-1 active:opacity-70">
          <Text className="text-sm text-slate-400 underline">{"Couldn't do it? Add a reason"}</Text>
        </Pressable>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-black/60">
          <Pressable className="flex-1" onPress={() => setOpen(false)} />
          <View className="max-h-[85%] rounded-t-3xl border-t border-white/10 bg-ink-850 p-4" style={{ paddingBottom: insets.bottom + 16 }}>
            <ScrollView contentContainerClassName="gap-3" keyboardShouldPersistTaps="handled">
              <Text className="text-lg font-bold text-white">Why did you miss {LABEL[objective]}?</Text>

              {reason ? null : (
                <View className="flex-row gap-2">
                  <Chip label="Today" active={day === 'today'} tone={tone} onPress={() => setDay('today')} />
                  <Chip label="Yesterday" active={day === 'yesterday'} tone={tone} onPress={() => setDay('yesterday')} />
                </View>
              )}

              <Input value={text} onChangeText={setText} placeholder="e.g. sore from yesterday's workout" multiline maxLength={200} />

              {suggestions.length ? <Muted>Common reasons</Muted> : null}
              <View className="flex-row flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Chip key={s} label={s} active={text === s} tone={tone} onPress={() => setText(s)} />
                ))}
              </View>

              <Button title="Save reason" tone={tone} onPress={save} disabled={!text.trim()} loading={busy} />
              {reason ? <Button title="Remove reason" variant="danger" onPress={clear} disabled={busy} /> : null}
              <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} />
              <Text className={`text-center text-xs ${TONE[tone].text}`}>
                {excuseLeft === undefined
                  ? 'Your reason shows up in your weekly report.'
                  : excuseLeft
                    ? '🧊 One reason a week keeps your streak alive. It also shows up in your weekly report.'
                    : "🧊 This week's streak save is used. The reason still shows up in your weekly report."}
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
