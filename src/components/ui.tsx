import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { C } from '../lib/theme';
import type { Level } from '../lib/types';

/** Section colours. Class strings must be literal so Tailwind can see them. */
export type Tone = 'brand' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'pink' | 'rose';

export const TONE: Record<Tone, { card: string; text: string; solid: string; soft: string; dot: string }> = {
  brand: { card: 'border-brand/30 bg-brand/10', text: 'text-brand-light', solid: 'bg-brand', soft: 'bg-brand/20', dot: 'bg-brand' },
  violet: { card: 'border-violet-400/30 bg-violet-500/10', text: 'text-violet-300', solid: 'bg-violet-500', soft: 'bg-violet-500/20', dot: 'bg-violet-400' },
  cyan: { card: 'border-cyan-400/30 bg-cyan-500/10', text: 'text-cyan-300', solid: 'bg-cyan-500', soft: 'bg-cyan-500/20', dot: 'bg-cyan-400' },
  emerald: { card: 'border-emerald-400/30 bg-emerald-500/10', text: 'text-emerald-300', solid: 'bg-emerald-500', soft: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
  amber: { card: 'border-amber-400/30 bg-amber-500/10', text: 'text-amber-300', solid: 'bg-amber-500', soft: 'bg-amber-500/20', dot: 'bg-amber-400' },
  pink: { card: 'border-pink-400/30 bg-pink-500/10', text: 'text-pink-300', solid: 'bg-pink-500', soft: 'bg-pink-500/20', dot: 'bg-pink-400' },
  rose: { card: 'border-rose-400/30 bg-rose-500/10', text: 'text-rose-300', solid: 'bg-rose-500', soft: 'bg-rose-500/20', dot: 'bg-rose-400' },
};

export function Screen({
  children, refreshing, onRefresh,
}: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void }) {
  return (
    <ScrollView
      className="flex-1 bg-ink-900"
      contentContainerClassName="p-4 pb-16 gap-4"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.brand} colors={[C.brand]} progressBackgroundColor={C.surface} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, tone, className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  const t = tone ? TONE[tone].card : 'border-white/10 bg-ink-850';
  return <View className={`rounded-3xl border p-4 gap-3 ${t} ${className}`}>{children}</View>;
}

export function H2({ children, right, tone }: { children: ReactNode; right?: ReactNode; tone?: Tone }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        {tone ? <View className={`h-2.5 w-2.5 rounded-full ${TONE[tone].dot}`} /> : null}
        <Text className="text-lg font-bold text-white">{children}</Text>
      </View>
      {right}
    </View>
  );
}

export function Muted({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Text className={`text-sm text-slate-400 ${className}`}>{children}</Text>;
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const VARIANTS: Record<Variant, [string, string]> = {
  primary: ['bg-brand', 'text-white'],
  secondary: ['bg-white/10', 'text-brand-light'],
  danger: ['bg-rose-500/15', 'text-rose-300'],
  ghost: ['bg-transparent', 'text-brand-light'],
};

export function Button({
  title, onPress, variant = 'primary', tone, disabled, loading, className = '',
}: {
  title: string; onPress: () => void; variant?: Variant; tone?: Tone; disabled?: boolean; loading?: boolean; className?: string;
}) {
  // A tone overrides the primary colour, e.g. emerald "Start workout".
  let [bg, fg] = VARIANTS[variant];
  if (tone && variant === 'primary') [bg, fg] = [TONE[tone].solid, 'text-ink-950'];
  if (tone && variant === 'secondary') [bg, fg] = [TONE[tone].soft, TONE[tone].text];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-2xl px-4 py-3 active:opacity-70 ${bg} ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color={C.text} /> : <Text className={`font-bold ${fg}`}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, tone = 'brand' }: { label: string; active?: boolean; onPress?: () => void; tone?: Tone }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 border ${active ? `${TONE[tone].solid} border-transparent` : 'bg-white/5 border-white/10'}`}
    >
      <Text className={`text-sm ${active ? 'text-ink-950 font-bold' : 'text-slate-300'}`}>{label}</Text>
    </Pressable>
  );
}

const LEVEL_STYLE: Record<Level, string> = {
  easy: 'bg-emerald-500/15 text-emerald-300',
  medium: 'bg-amber-500/15 text-amber-300',
  hard: 'bg-rose-500/15 text-rose-300',
};

export const LEVEL_BAR: Record<Level, string> = {
  easy: 'bg-emerald-400',
  medium: 'bg-amber-400',
  hard: 'bg-rose-400',
};

export function LevelBadge({ level }: { level: Level }) {
  return <Text className={`self-start rounded-md px-2 py-0.5 text-xs font-bold capitalize ${LEVEL_STYLE[level]}`}>{level}</Text>;
}

export function Input(props: TextInputProps & { label?: string }) {
  const { label, className = '', ...rest } = props;
  return (
    <View className="gap-1">
      {label ? <Text className="text-sm font-medium text-slate-300">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#64748b"
        selectionColor={C.brand}
        className={`rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-base text-white ${className}`}
        {...rest}
      />
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 gap-2">
      <Text className="text-rose-200">{message}</Text>
      {onRetry ? <Button title="Retry" variant="danger" onPress={onRetry} /> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-ink-900 p-8">
      <ActivityIndicator size="large" color={C.brand} />
    </View>
  );
}

export const RESULT_LABEL = {
  solved: '✅ Solved',
  solved_with_hint: '💡 With hint',
  failed: '❌ Failed',
} as const;
