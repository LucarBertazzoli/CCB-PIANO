import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, SectionTitle } from '@/components/ui';
import { inputHub } from '@/input/input-hub';
import type { InputSourceKind } from '@/input/types';
import { noteName } from '@/music/theory';
import { useProgress } from '@/store/progress';
import { useSettings, type SettingsState } from '@/store/settings';
import { colors, space } from '@/theme';

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.rowBox}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.rowControls}>{children}</View>
    </View>
  );
}

function Options<K extends keyof SettingsState>({
  k,
  options,
}: {
  k: K;
  options: { value: SettingsState[K]; label: string }[];
}) {
  const value = useSettings((s) => s[k]);
  const set = useSettings((s) => s.set);
  return (
    <>
      {options.map((o) => (
        <Chip
          key={String(o.value)}
          compact
          label={o.label}
          selected={value === o.value}
          onPress={() => set({ [k]: o.value } as Partial<SettingsState>)}
        />
      ))}
    </>
  );
}

function Toggle({ k }: { k: 'playAccompaniment' | 'metronome' | 'showKeyLabels' | 'unlockAll' }) {
  const value = useSettings((s) => s[k]);
  const set = useSettings((s) => s.set);
  return <Switch value={value} onValueChange={(v) => set({ [k]: v })} />;
}

/** Testa a entrada escolhida mostrando a nota detectada ao vivo. */
function InputTester() {
  const source = useSettings((s) => s.inputSource);
  const sensitivity = useSettings((s) => s.micSensitivity);
  const notation = useSettings((s) => s.notation);
  const [active, setActive] = useState(false);
  const [last, setLast] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const offStatus = inputHub.onStatusChange(() => setError(inputHub.error));
    const off = inputHub.subscribe((e) => {
      if (e.type === 'on') setLast(e.midi);
    });
    void inputHub.use(source, { micSensitivity: sensitivity });
    return () => {
      off();
      offStatus();
      inputHub.stop();
    };
  }, [active, source, sensitivity]);

  if (source === 'touch') return null;
  return (
    <Card style={{ gap: space.sm, marginTop: space.sm }}>
      <Text style={styles.label}>Testar {source === 'mic' ? 'microfone' : 'teclado MIDI'}</Text>
      <Text style={styles.hint}>
        {source === 'mic'
          ? 'Toque uma nota de cada vez no seu instrumento, perto do celular.'
          : 'Conecte o teclado e toque algumas notas.'}
      </Text>
      <Text style={styles.detected}>{last !== null ? noteName(last, notation, { withOctave: true }) : '—'}</Text>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <Button title={active ? 'Parar teste' : 'Iniciar teste'} variant="secondary" onPress={() => setActive(!active)} />
    </Card>
  );
}

export default function SettingsScreen() {
  const resetProgress = useProgress((s) => s.reset);
  const volume = useSettings((s) => s.volume);
  const set = useSettings((s) => s.set);

  const sources: { value: InputSourceKind; label: string }[] = [
    { value: 'touch', label: 'Tela' },
    { value: 'midi', label: 'MIDI' },
    { value: 'mic', label: 'Microfone' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ajustes</Text>

        <SectionTitle>Como o app ouve você</SectionTitle>
        <Row
          label="Entrada"
          hint={
            Platform.OS === 'web'
              ? 'MIDI: teclado conectado por USB (Chrome/Edge). Microfone: o app escuta seu piano/órgão.'
              : 'Microfone: o app escuta seu piano/órgão. MIDI no celular chegará em breve.'
          }>
          <Options k="inputSource" options={sources} />
        </Row>
        <Row label="Sensibilidade do microfone" hint="Aumente se o app não perceber notas suaves.">
          <Options
            k="micSensitivity"
            options={[
              { value: 0.02, label: 'Baixa' },
              { value: 0.01, label: 'Média' },
              { value: 0.004, label: 'Alta' },
            ]}
          />
        </Row>
        <InputTester />

        <SectionTitle>Som</SectionTitle>
        <Row label="Timbre">
          <Options
            k="instrument"
            options={[
              { value: 'piano', label: 'Piano' },
              { value: 'organ', label: 'Órgão' },
            ]}
          />
        </Row>
        <Row label="Volume">
          {[0.4, 0.7, 1].map((v) => (
            <Chip key={v} compact label={`${Math.round(v * 100)}%`} selected={volume === v} onPress={() => set({ volume: v })} />
          ))}
        </Row>
        <Row label="Tocar a outra mão" hint="Quando você pratica uma mão, o app toca a outra.">
          <Toggle k="playAccompaniment" />
        </Row>
        <Row label="Metrônomo">
          <Toggle k="metronome" />
        </Row>

        <SectionTitle>Visual</SectionTitle>
        <Row label="Nome das notas">
          <Options
            k="notation"
            options={[
              { value: 'solfege', label: 'Dó Ré Mi' },
              { value: 'letters', label: 'C D E' },
            ]}
          />
        </Row>
        <Row label="Dentro das notas que caem">
          <Options
            k="noteLabels"
            options={[
              { value: 'name', label: 'Nome' },
              { value: 'finger', label: 'Dedo' },
              { value: 'none', label: 'Nada' },
            ]}
          />
        </Row>
        <Row label="Velocidade das notas">
          <Options
            k="fallSpeed"
            options={[
              { value: 110, label: 'Lenta' },
              { value: 160, label: 'Normal' },
              { value: 220, label: 'Rápida' },
            ]}
          />
        </Row>
        <Row label="Nomes nas teclas">
          <Toggle k="showKeyLabels" />
        </Row>

        <SectionTitle>Instrutores</SectionTitle>
        <Row label="Liberar todas as lições" hint="Útil para instrutores e para revisar conteúdo.">
          <Toggle k="unlockAll" />
        </Row>
        <Button title="Recomeçar a trilha do zero" variant="secondary" onPress={resetProgress} style={{ marginTop: space.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 80 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  rowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  rowControls: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  hint: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  detected: { color: colors.primary, fontSize: 40, fontWeight: '900', textAlign: 'center' },
});
