import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Button, Card, Input, Loading, Muted, Screen } from '../components/ui';
import { api } from '../lib/api';
import type { Profile } from '../lib/types';
import { useApi } from '../lib/useApi';

type TextKey = Exclude<keyof Profile, 'weakAreas' | 'skills' | 'highlights'>;
const FIELDS: { key: TextKey; label: string; placeholder: string }[] = [
  { key: 'stack', label: 'Stack', placeholder: 'Python, FastAPI, React Native' },
  { key: 'experience', label: 'Experience', placeholder: '2 years backend' },
  { key: 'targetRole', label: 'Target role', placeholder: 'SDE 2 / Backend engineer' },
  { key: 'targetCTC', label: 'Target CTC', placeholder: '12–15 LPA' },
  { key: 'targetDate', label: 'Target date', placeholder: '2027-05' },
];

export default function ProfileScreen() {
  const { data, loading } = useApi(api.profile);
  const [p, setP] = useState<Profile | null>(null);
  const [weak, setWeak] = useState('');
  const [skills, setSkills] = useState('');
  const [highlights, setHighlights] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !p) {
      setP(data);
      setWeak((data.weakAreas ?? []).join(', '));
      setSkills((data.skills ?? []).join(', '));
      setHighlights((data.highlights ?? []).join('\n'));
    }
  }, [data, p]);

  if (!p || loading) return <Loading />;

  const save = async () => {
    setSaving(true);
    try {
      const list = (s: string, sep: string | RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);
      await api.saveProfile({ ...p, weakAreas: list(weak, ','), skills: list(skills, ','), highlights: list(highlights, '\n') });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Muted>Sent to the AI with your stats. Keep it to personal study info, nothing from work.</Muted>
        {FIELDS.map((f) => (
          <Input key={f.key} label={f.label} placeholder={f.placeholder} value={p[f.key]} onChangeText={(v) => setP({ ...p, [f.key]: v })} />
        ))}
        <Input label="Weak areas (comma separated)" placeholder="DP, graphs" value={weak} onChangeText={setWeak} />
        <Input label="Skills (comma separated)" placeholder="FastAPI, MongoDB, React" value={skills} onChangeText={setSkills} multiline className="min-h-20" />
        <Input
          label="Project highlights (one per line, no company names)"
          placeholder="Built a payouts module with invoice PDFs"
          value={highlights}
          onChangeText={setHighlights}
          multiline
          className="min-h-32"
        />
      </Card>
      <Button title="Save" tone="amber" onPress={save} loading={saving} />
    </Screen>
  );
}
