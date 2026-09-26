import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Glass, OptionCard, Row, SectionTitle, Segmented, Swatch } from '@/features/player/controls';
import { DEFAULT_COLORS, useSettings, type ColorChoices, type FontChoice } from '@/store/settings';
import { FACES, usePalette, useType } from '@/theme';
import { normalizeHex, readableOn } from '@/theme/color';

/**
 * Aparência: fonte (Verdana, serifada ou OpenDyslexic) e cores. Preto e
 * branco é o padrão; no modo colorido cada peça pode ter a sua cor.
 */

type Role = keyof ColorChoices;

const ROLES: { role: Role; label: string; hint: string }[] = [
  { role: 'accent', label: 'Destaque', hint: 'Botões e cursor' },
  { role: 'right', label: 'Mão direita', hint: 'Manual superior' },
  { role: 'left', label: 'Mão esquerda', hint: 'Manual inferior' },
  { role: 'pedal', label: 'Pedaleira', hint: 'Pés' },
  { role: 'hit', label: 'Acerto', hint: 'Nota certa' },
  { role: 'miss', label: 'Erro', hint: 'Nota errada' },
  { role: 'background', label: 'Fundo', hint: 'Fundo do app' },
  { role: 'paper', label: 'Papel', hint: 'Fundo da partitura' },
];

const VIVID = [
  '#E53935', '#FF5A1F', '#FB8C00', '#F9A825', '#FDD835', '#C0CA33', '#43C463', '#2E7D32', '#26A69A', '#00ACC1',
  '#3FA9F5', '#1E88E5', '#3949AB', '#A06BFF', '#8E24AA', '#D81B60', '#F48FB1', '#8D6E63', '#BDBDBD', '#FFFFFF',
];
const DARKS = ['#000000', '#0D0D0D', '#1A1A1A', '#262626', '#0B1220', '#0E1A2B', '#0F1A14', '#1A0F14', '#14101F', '#1F1A12'];
const PAPERS = ['#FFFFFF', '#FBF8F1', '#F6F0E1', '#F3EBD6', '#EFE6CF', '#EEF2F5', '#F0F0F0', '#E8E8E8'];

const FONTS: { value: FontChoice; title: string; subtitle: string }[] = [
  { value: 'verdana', title: 'Verdana', subtitle: 'A mesma do site da CCB' },
  { value: 'serif', title: 'Serifada', subtitle: 'Clássica, de livro' },
  { value: 'dyslexic', title: 'OpenDyslexic', subtitle: 'Mais fácil para quem tem dislexia' },
];

export function AppearanceSettings() {
  const pal = usePalette();
  const t = useType();
  const settings = useSettings();
  const [role, setRole] = useState<Role>('accent');
  const colors = settings.colors;
  const setColor = (r: Role, value: string) => settings.set({ colors: { ...colors, [r]: value } });
  const swatches = role === 'background' ? DARKS : role === 'paper' ? PAPERS : VIVID;
  const current = colors[role];

  return (
    <View style={styles.root}>
      <SectionTitle>Fonte</SectionTitle>
      <View style={styles.cards}>
        {FONTS.map((f) => (
          <OptionCard
            key={f.value}
            title={f.title}
            subtitle={f.subtitle}
            selected={settings.fontChoice === f.value}
            onPress={() => settings.set({ fontChoice: f.value })}
            preview={<Text style={[FACES[f.value].regular, styles.fontSample, { color: pal.text }]}>Aa</Text>}
          />
        ))}
      </View>

      <SectionTitle>Cores</SectionTitle>
      <Glass>
        <Row
          label="Modo de cor"
          hint={settings.colorMode === 'mono' ? 'Preto e branco, como o hinário.' : 'Escolha a cor de cada parte abaixo.'}
          last={settings.colorMode === 'mono'}>
          <Segmented
            options={[
              { value: 'mono', label: 'Preto e branco' },
              { value: 'color', label: 'Colorido' },
            ]}
            value={settings.colorMode}
            onChange={(v) => settings.set({ colorMode: v as 'mono' | 'color' })}
          />
        </Row>

        {settings.colorMode === 'color' ? (
          <View style={styles.colorArea}>
            {/* Partes: cada uma com a cor atual */}
            <View style={styles.roles}>
              {ROLES.map((r) => {
                const on = r.role === role;
                return (
                  <Pressable
                    key={r.role}
                    onPress={() => setRole(r.role)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.role, { backgroundColor: on ? pal.surfaceStrong : 'transparent', borderColor: on ? pal.text : pal.border }]}>
                    <View style={[styles.roleDot, { backgroundColor: colors[r.role] }]} />
                    <View style={styles.roleText}>
                      <Text style={[on ? t.bold : t.regular, styles.roleLabel, { color: pal.text }]} numberOfLines={1}>
                        {r.label}
                      </Text>
                      <Text style={[t.regular, styles.roleHint, { color: pal.textDim }]} numberOfLines={1}>
                        {r.hint}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Escolha da cor da parte selecionada */}
            <View style={styles.picker}>
              <View style={styles.swatches}>
                {swatches.map((c) => (
                  <Swatch key={c} color={c} size={26} label={`Cor ${c}`} selected={c === current} onPress={() => setColor(role, c)} />
                ))}
              </View>
              <View style={styles.hexRow}>
                <HexField key={`${role}${current}`} value={current} onApply={(v) => setColor(role, v)} />
                <Pressable
                  onPress={() => setColor(role, DEFAULT_COLORS[role])}
                  accessibilityRole="button"
                  style={[styles.textButton, { borderColor: pal.border }]}>
                  <Text style={[t.regular, styles.textButtonLabel, { color: pal.text }]}>Padrão</Text>
                </Pressable>
              </View>
              <Preview />
              <Pressable
                onPress={() => settings.set({ colors: DEFAULT_COLORS })}
                accessibilityRole="button"
                style={styles.resetAll}>
                <Text style={[t.regular, styles.resetText, { color: pal.textDim }]}>Restaurar todas as cores</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Glass>
    </View>
  );
}

/** Campo para digitar qualquer cor (#RRGGBB). */
function HexField({ value, onApply }: { value: string; onApply: (v: string) => void }) {
  const pal = usePalette();
  const t = useType();
  const [draft, setDraft] = useState(value);
  const valid = normalizeHex(draft);
  const apply = () => {
    if (valid) onApply(valid);
    else setDraft(value);
  };
  return (
    <View style={[styles.hex, { borderColor: valid ? pal.border : pal.keyWrong, backgroundColor: pal.surfaceStrong }]}>
      <View style={[styles.hexDot, { backgroundColor: valid ?? value }]} />
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={apply}
        onSubmitEditing={apply}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={7}
        style={[t.regular, styles.hexInput, { color: pal.text }]}
        accessibilityLabel="Código da cor"
      />
    </View>
  );
}

/** Prévia: teclas acesas, acerto/erro e um pedaço de partitura. */
function Preview() {
  const pal = usePalette();
  const keys = [
    { bg: pal.keyRight[0], fg: pal.keyRight[2], mark: null },
    { bg: pal.keyWhite, fg: pal.keyLabel, mark: null },
    { bg: pal.keyLeft[0], fg: pal.keyLeft[2], mark: null },
    { bg: pal.keyCorrect, fg: readableOn(pal.keyCorrect), mark: 'check' as const },
    { bg: pal.keyWrong, fg: readableOn(pal.keyWrong), mark: 'close' as const },
    { bg: pal.keyPedal[0], fg: pal.keyPedal[2], mark: null },
  ];
  return (
    <View style={styles.preview}>
      <View style={[styles.previewKeys, { backgroundColor: pal.bg }]}>
        {keys.map((k, i) => (
          <View key={i} style={[styles.previewKey, { backgroundColor: k.bg }]}>
            {k.mark ? <Icon name={k.mark} size={12} color={k.fg} /> : null}
          </View>
        ))}
      </View>
      <View style={[styles.previewPaper, { backgroundColor: pal.paper }]}>
        {[0, 1, 2, 3, 4].map((l) => (
          <View key={l} style={[styles.previewLine, { top: 8 + l * 6, backgroundColor: pal.staff }]} />
        ))}
        {[pal.inkRight, pal.inkLeft, pal.inkHit, pal.inkPedal].map((c, i) => (
          <View key={i} style={[styles.previewHead, { left: 10 + i * 17, top: 16 - (i % 2) * 6, backgroundColor: c }]} />
        ))}
        <View style={[styles.previewCursor, { backgroundColor: pal.cursor, borderLeftColor: pal.cursorEdge }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  cards: { flexDirection: 'row', gap: 10 },
  fontSample: { fontSize: 26 },
  colorArea: { flexDirection: 'row', gap: 14, paddingVertical: 12 },
  roles: { width: 196, gap: 6 },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
  },
  roleDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  roleText: { flexShrink: 1 },
  roleLabel: { fontSize: 13 },
  roleHint: { fontSize: 10 },
  picker: { flex: 1, gap: 12 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  hexRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  hex: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, height: 36, width: 150 },
  hexDot: { width: 18, height: 18, borderRadius: 9 },
  hexInput: { flex: 1, fontSize: 14, padding: 0, letterSpacing: 1 },
  textButton: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, height: 36, justifyContent: 'center' },
  textButtonLabel: { fontSize: 13 },
  preview: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  previewKeys: { flexDirection: 'row', gap: 2, padding: 3, borderRadius: 6 },
  previewKey: { width: 22, height: 44, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3 },
  previewPaper: { width: 90, height: 44, borderRadius: 6, overflow: 'hidden' },
  previewLine: { position: 'absolute', left: 4, right: 4, height: 1 },
  previewHead: { position: 'absolute', width: 8, height: 6, borderRadius: 3 },
  previewCursor: { position: 'absolute', left: 44, top: 4, bottom: 4, width: 16, borderLeftWidth: 2 },
  resetAll: { alignSelf: 'flex-start', paddingVertical: 4 },
  resetText: { fontSize: 12, textDecorationLine: 'underline' },
});
