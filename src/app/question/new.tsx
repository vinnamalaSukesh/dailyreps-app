import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button, Card, Chip, Input, Muted, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import type { Level } from '../../lib/types';

const LEVELS: Level[] = ['easy', 'medium', 'hard'];

export default function NewQuestion() {
  const [ref, setRef] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<Level>('medium');
  const [pattern, setPattern] = useState('');
  const [tags, setTags] = useState('');
  const [found, setFound] = useState<string | null>(null);
  const [busy, setBusy] = useState<'lookup' | 'save' | null>(null);

  const lookup = async () => {
    if (!ref.trim()) return;
    setBusy('lookup');
    try {
      const info = await api.lookup(ref.trim());
      setTitle(info.title);
      setLevel(info.level);
      setTags(info.tags.join(', '));
      setFound(`#${info.lcNumber} · ${info.slug}`);
    } catch (e) {
      setFound(null);
      Alert.alert('Lookup failed', `${(e as Error).message}\n\nYou can fill the fields manually.`);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy('save');
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.addQuestion({
        ref: found ? ref.trim() : undefined,
        title: title.trim() || undefined,
        level,
        tags: tagList,
        pattern: pattern.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Card>
        <Input
          label="LeetCode number, slug or URL"
          placeholder="e.g. 15, 3sum or a leetcode.com/problems/… link"
          value={ref}
          onChangeText={(v) => { setRef(v); setFound(null); }}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={lookup}
        />
        <Button title="🔍  Look up" variant="secondary" tone="amber" onPress={lookup} loading={busy === 'lookup'} disabled={!ref.trim()} />
        {found ? <Text className="text-sm text-emerald-300">Found {found}</Text> : null}
      </Card>

      <Card>
        <Muted>Filled from LeetCode, or type them in yourself.</Muted>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Two Sum" />
        <Text className="text-sm font-medium text-slate-200">Difficulty</Text>
        <View className="flex-row gap-2">
          {LEVELS.map((l) => (
            <Chip key={l} label={l} active={level === l} onPress={() => setLevel(l)} tone={l === 'easy' ? 'emerald' : l === 'medium' ? 'amber' : 'rose'} />
          ))}
        </View>
        <Input label="Pattern (used for revisit spacing)" value={pattern} onChangeText={setPattern} placeholder="auto from tags, e.g. sliding window" autoCapitalize="none" />
        <Input label="Tags (comma separated)" value={tags} onChangeText={setTags} placeholder="Array, Hash Table" />
      </Card>

      <Button title="Save" tone="violet" onPress={save} loading={busy === 'save'} disabled={!title.trim()} />
    </Screen>
  );
}
