import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { usePalette, useType } from '@/theme';

/**
 * Peças visuais dos painéis (inspiradas no Artie): cartões de vidro escuros,
 * botões redondos, seletores segmentados, chaves e amostras de cor.
 */

export function Glass({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return <View style={[styles.glass, { backgroundColor: p.surface, borderColor: p.border }, style]}>{children}</View>;
}

export function RoundButton({
  icon,
  label,
  onPress,
  active,
  size = 44,
  accessibilityLabel,
}: {
  icon?: IconName;
  label?: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
  accessibilityLabel: string;
}) {
  const p = usePalette();
  const t = useType();
  const fg = active ? p.primaryText : p.text;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.round,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? p.primary : p.surfaceStrong,
          borderColor: p.border,
        },
        pressed && styles.pressed,
      ]}>
      {icon ? <Icon name={icon} size={size * 0.46} color={fg} /> : null}
      {label ? <Text style={[t.bold, { color: fg, fontSize: size * 0.4 }]}>{label}</Text> : null}
    </Pressable>
  );
}

/** Seletor segmentado: todas as opções visíveis, a escolhida preenchida. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  compact,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  compact?: boolean;
}) {
  const p = usePalette();
  const t = useType();
  return (
    <View style={[styles.segmented, { backgroundColor: p.surfaceStrong, borderColor: p.border }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.segment, compact && styles.segmentCompact, on && { backgroundColor: p.primary }]}>
            <Text style={[on ? t.bold : t.regular, styles.segmentText, { color: on ? p.primaryText : p.text }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Chave liga/desliga. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onChange(!value)}
      style={[styles.toggle, { backgroundColor: value ? p.primary : p.surfaceStrong, borderColor: p.border }]}>
      <View
        style={[
          styles.knob,
          { backgroundColor: value ? p.primaryText : '#8C8C8C', alignSelf: value ? 'flex-end' : 'flex-start' },
        ]}
      />
    </Pressable>
  );
}

/** Seletor com sublinhado (usado na entrada: Hinos | Coros). */
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
  const t = useType();
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
            <Text style={[on ? t.bold : t.regular, styles.underlineText, { color: on ? p.text : p.textDim }]}>
              {o.label}
            </Text>
            <View style={[styles.underlineBar, { backgroundColor: on ? p.text : p.border, height: on ? 3 : 2 }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Linha de opção: título (e explicação curta) à esquerda, controle à direita. */
export function Row({
  label,
  hint,
  children,
  onPress,
  last,
  stacked,
}: {
  label: string;
  hint?: string;
  children?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  /** Controle embaixo do título (para seletores largos). */
  stacked?: boolean;
}) {
  const p = usePalette();
  const t = useType();
  const content = (
    <View
      style={[
        stacked ? styles.rowStacked : styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.border },
      ]}>
      <View style={stacked ? undefined : styles.rowText}>
        <Text style={[t.regular, styles.rowLabel, { color: p.text }]}>{label}</Text>
        {hint ? <Text style={[t.regular, styles.rowHint, { color: p.textDim }]}>{hint}</Text> : null}
      </View>
      <View style={stacked ? styles.rowBelow : styles.rowRight}>{children}</View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

/** Título pequeno de seção, em versalete. */
export function SectionTitle({ children }: { children: string }) {
  const p = usePalette();
  const t = useType();
  return <Text style={[t.bold, styles.section, { color: p.textDim }]}>{children.toUpperCase()}</Text>;
}

export function Label({ children, dim }: { children: ReactNode; dim?: boolean }) {
  const p = usePalette();
  const t = useType();
  return <Text style={[t.regular, styles.label, { color: dim ? p.textDim : p.text }]}>{children}</Text>;
}

/** Pílulas de escolha (uma só). */
export function Choices<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ChipRow
      options={options}
      isOn={(v) => v === value}
      onPress={onChange}
      role="button"
    />
  );
}

/** Pílulas de escolha (várias). */
export function MultiChoices<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: { value: T; label: string }[];
  values: T[];
  onToggle: (v: T) => void;
}) {
  return <ChipRow options={options} isOn={(v) => values.includes(v)} onPress={onToggle} role="checkbox" />;
}

function ChipRow<T extends string | number>({
  options,
  isOn,
  onPress,
  role,
}: {
  options: { value: T; label: string }[];
  isOn: (v: T) => boolean;
  onPress: (v: T) => void;
  role: 'button' | 'checkbox';
}) {
  const p = usePalette();
  const t = useType();
  return (
    <View style={styles.choices}>
      {options.map((o) => {
        const on = isOn(o.value);
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onPress(o.value)}
            accessibilityRole={role}
            accessibilityState={role === 'checkbox' ? { checked: on } : { selected: on }}
            style={[styles.choice, { backgroundColor: on ? p.primary : 'transparent', borderColor: on ? p.primary : p.border }]}>
            <Text style={[on ? t.bold : t.regular, styles.choiceText, { color: on ? p.primaryText : p.text }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Cartão grande de escolha (com ícone ou prévia), como os modos do Artie. */
export function OptionCard({
  title,
  subtitle,
  icon,
  preview,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  preview?: ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  const p = usePalette();
  const t = useType();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: p.surface, borderColor: selected ? p.primary : p.border, borderWidth: selected ? 2 : 1 },
        pressed && styles.pressed,
      ]}>
      {preview ?? (icon ? <Icon name={icon} size={26} color={p.text} /> : null)}
      <Text style={[t.bold, styles.optionTitle, { color: p.text }]} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[t.regular, styles.optionSub, { color: p.textDim }]} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
      {selected ? (
        <View style={[styles.optionCheck, { backgroundColor: p.primary }]}>
          <Icon name="check" size={12} color={p.primaryText} />
        </View>
      ) : null}
    </Pressable>
  );
}

/** Amostra de cor redonda. */
export function Swatch({
  color,
  selected,
  onPress,
  size = 30,
  label,
}: {
  color: string;
  selected?: boolean;
  onPress?: () => void;
  size?: number;
  label: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[
        styles.swatchRing,
        { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, borderColor: selected ? p.text : 'transparent' },
      ]}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  glass: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4 },
  round: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  segmented: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 3 },
  segment: { borderRadius: 999, paddingHorizontal: 14, height: 32, alignItems: 'center', justifyContent: 'center' },
  segmentCompact: { paddingHorizontal: 10, height: 28 },
  segmentText: { fontSize: 13 },
  toggle: { width: 54, height: 30, borderRadius: 15, padding: 3, borderWidth: 1, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11 },
  underlineRow: { flexDirection: 'row', gap: 12 },
  underlineItem: { alignItems: 'center', gap: 4, minWidth: 64 },
  underlineText: { fontSize: 13 },
  underlineBar: { alignSelf: 'stretch', borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 8 },
  rowStacked: { gap: 10, paddingVertical: 12 },
  rowText: { flexShrink: 1, gap: 2 },
  rowLabel: { fontSize: 14 },
  rowHint: { fontSize: 11, lineHeight: 15 },
  rowRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBelow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  section: { fontSize: 10, letterSpacing: 1.4, marginTop: 6, marginBottom: 2, marginLeft: 4 },
  label: { fontSize: 13 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, height: 32, justifyContent: 'center' },
  choiceText: { fontSize: 13 },
  option: { flex: 1, borderRadius: 18, padding: 14, gap: 6, minHeight: 104 },
  optionTitle: { fontSize: 14, marginTop: 2 },
  optionSub: { fontSize: 11, lineHeight: 15 },
  optionCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRing: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
