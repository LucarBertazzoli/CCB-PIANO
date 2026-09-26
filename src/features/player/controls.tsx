import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, usePalette } from '@/theme';

/**
 * Peças visuais do painel do player (inspirado no Artie): cartões de vidro
 * escuros, botões redondos, pílulas, chaves e seletores com sublinhado.
 */

export function Glass({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return <View style={[styles.glass, { backgroundColor: p.surface, borderColor: p.border }, style]}>{children}</View>;
}

export function RoundButton({
  label,
  onPress,
  active,
  size = 44,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
  accessibilityLabel?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.round,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? p.primary : p.surfaceStrong,
          borderColor: p.border,
        },
        pressed && { opacity: 0.7 },
      ]}>
      <Text style={[styles.roundText, { color: active ? p.primaryText : p.text, fontSize: size * 0.4 }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  label,
  icon,
  onPress,
  active,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  active?: boolean;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: active ? p.primary : p.surfaceStrong, borderColor: p.border },
        pressed && { opacity: 0.75 },
      ]}>
      <Text style={[styles.pillText, { color: active ? p.primaryText : p.text }]}>{label}</Text>
      {icon ? <Text style={[styles.pillIcon, { color: active ? p.primaryText : p.text }]}>{icon}</Text> : null}
    </Pressable>
  );
}

/** Chave liga/desliga grande, como no print. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={[styles.toggle, { backgroundColor: value ? p.primary : p.surfaceStrong, borderColor: p.border }]}>
      <View
        style={[
          styles.knob,
          { backgroundColor: value ? p.primaryText : '#9A9A9A', alignSelf: value ? 'flex-end' : 'flex-start' },
        ]}
      />
    </Pressable>
  );
}

/** Seletor com sublinhado (ex.: App | Você), como “Artie plays: Off | On”. */
export function Underline<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const p = usePalette();
  return (
    <View style={styles.underlineRow}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={styles.underlineItem}>
            <Text style={[styles.underlineText, { color: on ? p.text : p.textDim }]}>{o.label}</Text>
            <View style={[styles.underlineBar, { backgroundColor: on ? p.text : p.border, height: on ? 3 : 2 }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Linha de opção: rótulo à esquerda, controle à direita. */
export function Row({
  icon,
  label,
  children,
  onPress,
  last,
}: {
  icon?: string;
  label: string;
  children?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const p = usePalette();
  const content = (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.border }]}>
      {icon ? <Text style={[styles.rowIcon, { color: p.text }]}>{icon}</Text> : null}
      <Text style={[styles.rowLabel, { color: p.text }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function Label({ children, dim }: { children: ReactNode; dim?: boolean }) {
  const p = usePalette();
  return <Text style={[styles.label, { color: dim ? p.textDim : p.text }]}>{children}</Text>;
}

/** Botões de escolha pequenos (texto simples, o escolhido em destaque). */
export function Choices<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const p = usePalette();
  return (
    <View style={styles.choices}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.choice, { backgroundColor: on ? p.primary : 'transparent', borderColor: on ? p.primary : p.border }]}>
            <Text style={[styles.choiceText, { color: on ? p.primaryText : p.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: { borderRadius: 26, borderWidth: 1, padding: 12 },
  round: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  roundText: { fontFamily: font, fontWeight: '700' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    height: 44,
  },
  pillText: { fontFamily: font, fontSize: 15 },
  pillIcon: { fontFamily: font, fontSize: 16 },
  toggle: { width: 58, height: 32, borderRadius: 16, padding: 3, borderWidth: 1, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12 },
  underlineRow: { flexDirection: 'row', gap: 12 },
  underlineItem: { alignItems: 'center', gap: 4, minWidth: 64 },
  underlineText: { fontFamily: font, fontSize: 13 },
  underlineBar: { alignSelf: 'stretch', borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingVertical: 6 },
  rowIcon: { fontFamily: font, fontSize: 16, width: 20, textAlign: 'center' },
  rowLabel: { fontFamily: font, fontSize: 15, flexShrink: 1 },
  rowRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontFamily: font, fontSize: 13 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  choiceText: { fontFamily: font, fontSize: 13 },
});

/** Como `Choices`, mas permite marcar várias opções. */
export function MultiChoices<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: { value: T; label: string }[];
  values: T[];
  onToggle: (v: T) => void;
}) {
  const p = usePalette();
  return (
    <View style={styles.choices}>
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <Pressable
            key={o.value}
            onPress={() => onToggle(o.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={[styles.choice, { backgroundColor: on ? p.primary : 'transparent', borderColor: on ? p.primary : p.border }]}>
            <Text style={[styles.choiceText, { color: on ? p.primaryText : p.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
