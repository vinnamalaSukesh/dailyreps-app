import { Image } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui';
import { ROUTINE } from '../data/workout';
import { api } from '../lib/api';
import { initialPlayer, playerReducer, READY_SEC } from '../lib/player';

const say = (text: string) => Speech.speak(text, { rate: 1.0 });
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function WorkoutPlayer() {
  useKeepAwake();
  const reducer = useMemo(() => playerReducer(ROUTINE), []);
  const [s, dispatch] = useReducer(reducer, initialPlayer);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saved = useRef(false);
  const ex = ROUTINE[s.index];
  const next = ROUTINE[s.index + 1];

  // 1-second clock
  useEffect(() => {
    if (s.phase === 'DONE') return;
    const t = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(t);
  }, [s.phase]);

  // Voice on entering a phase
  useEffect(() => {
    if (s.phase === 'READY') say(`Get ready. First up, ${ROUTINE[0]?.name ?? ''}`);
    if (s.phase === 'EXERCISE') say(s.index === 0 ? `Go! ${ex.name}` : ex.name);
    if (s.phase === 'REST' && next) say(`Rest. Next, ${next.name}`);
    if (s.phase === 'DONE') {
      say('Workout complete. Great job!');
      if (!saved.current) {
        saved.current = true;
        api.completeWorkout().catch((e) => setSaveError((e as Error).message));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase, s.index]);

  // Countdown voice: READY "1, 2, 3", last 3 seconds of exercise "3, 2, 1"
  useEffect(() => {
    if (s.paused) return;
    if (s.phase === 'READY' && s.remaining < READY_SEC) say(String(READY_SEC - s.remaining));
    if (s.phase === 'EXERCISE' && s.remaining <= 3 && s.remaining < ex.durationSec) say(String(s.remaining));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.remaining]);

  useEffect(() => () => { Speech.stop(); }, []);

  const quit = () => { Speech.stop(); router.back(); };
  const total = s.phase === 'EXERCISE' ? ex.durationSec : s.phase === 'REST' ? ROUTINE[s.index].restSec : READY_SEC;
  const progress = s.phase === 'DONE' ? 1 : 1 - s.remaining / total;

  if (s.phase === 'DONE') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-ink-900 p-6">
        <Text className="text-7xl">🎉</Text>
        <Text className="text-3xl font-black text-emerald-300">Workout complete</Text>
        <Text className="text-base text-slate-300">{ROUTINE.length} exercises done. Streak updated 🔥</Text>
        {saveError ? <Text className="text-center text-rose-300">Couldn't save: {saveError}</Text> : null}
        <Button title="Close" tone="emerald" onPress={quit} className="mt-4 w-48" />
      </SafeAreaView>
    );
  }

  const isRest = s.phase === 'REST';
  const shown = isRest ? next : s.phase === 'READY' ? ROUTINE[0] : ex;

  return (
    <SafeAreaView className={`flex-1 ${isRest ? 'bg-emerald-700' : s.phase === 'READY' ? 'bg-violet-700' : 'bg-ink-900'}`}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className={`text-sm font-bold uppercase tracking-widest ${s.phase === 'EXERCISE' ? 'text-emerald-300' : 'text-white/80'}`}>
          {s.phase === 'READY' ? 'Get ready' : isRest ? 'Rest' : `Exercise ${s.index + 1} / ${ROUTINE.length}`}
        </Text>
        <Pressable onPress={quit} hitSlop={12}>
          <Text className="text-2xl text-white/70">✕</Text>
        </Pressable>
      </View>

      <View className="h-1.5 w-full bg-white/10">
        <View className={`h-full ${s.phase === 'EXERCISE' ? 'bg-emerald-400' : 'bg-white'}`} style={{ width: `${progress * 100}%` }} />
      </View>
      {/* Overall progress: one segment per exercise */}
      <View className="flex-row gap-1 px-4 pt-2">
        {ROUTINE.map((_, i) => (
          <View
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < s.index || (i === s.index && isRest) ? 'bg-emerald-400' : i === s.index && s.phase === 'EXERCISE' ? 'bg-amber-300' : 'bg-white/15'
            }`}
          />
        ))}
      </View>

      <View className="flex-1 items-center justify-center gap-4 px-6">
        {shown?.image ? (
          <View className={`w-full flex-1 max-h-[55%] rounded-3xl bg-white p-3 ${isRest || s.phase === 'READY' ? 'opacity-90' : ''}`}>
            <Image source={shown.image} style={{ flex: 1 }} contentFit="contain" />
          </View>
        ) : null}
        {isRest ? <Text className="text-base font-semibold text-white/80">Next up</Text> : null}
        <Text className="text-center text-3xl font-extrabold text-white">
          {shown?.name}
        </Text>
        {s.phase === 'EXERCISE' && ex.cue ? <Text className="text-center text-base text-slate-400">{ex.cue}</Text> : null}
        <Text
          className={`text-7xl font-black tabular-nums ${
            s.phase !== 'EXERCISE' ? 'text-white' : s.remaining <= 3 ? 'text-rose-400' : 'text-emerald-300'
          }`}
        >
          {s.phase === 'READY' ? (s.remaining === READY_SEC ? '…' : READY_SEC - s.remaining) : fmt(s.remaining)}
        </Text>
      </View>

      <View className="flex-row gap-3 p-4">
        <Button
          title={s.paused ? '▶ Resume' : '❚❚ Pause'}
          variant={s.paused ? 'primary' : 'secondary'}
          tone="amber"
          className="flex-1"
          onPress={() => { Speech.stop(); dispatch({ type: 'TOGGLE_PAUSE' }); }}
        />
        <Button title="Skip ⏭" variant="secondary" tone="cyan" className="flex-1" onPress={() => { Speech.stop(); dispatch({ type: 'SKIP' }); }} />
      </View>
    </SafeAreaView>
  );
}
