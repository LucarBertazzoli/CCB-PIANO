import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';

import type { Illustration } from '@/content/types';
import { useSettings } from '@/store/settings';

import { FigureRow } from './Figures';
import { keyboardLayout } from './keyboard-layout';
import { PianoKeyboard, type KeyHint } from './PianoKeyboard';
import { StaffNotes } from './StaffNote';

/** Mostra a ilustração de uma explicação ou pergunta: pauta, teclado e/ou figuras. */
export function IllustrationView({ illustration, compact }: { illustration: Illustration; compact?: boolean }) {
  const { width, height } = useWindowDimensions();
  const notation = useSettings((s) => s.notation);
  const keys = illustration.keys;
  const layout = useMemo(() => {
    if (!keys?.length) return null;
    const low = Math.min(48, Math.floor(Math.min(...keys) / 12) * 12);
    const high = Math.max(72, Math.ceil((Math.max(...keys) + 1) / 12) * 12);
    return keyboardLayout(low, high, Math.max(240, Math.min(width - 32, 720)));
  }, [keys, width]);
  const hints = useMemo(
    () => new Map<number, KeyHint>((keys ?? []).map((m) => [m, { state: m < 60 ? 'expected-left' : 'expected-right' }])),
    [keys],
  );
  const h = compact ? Math.min(110, height * 0.24) : Math.min(140, height * 0.3);

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      {illustration.figures?.length ? <FigureRow names={illustration.figures} size={compact ? 44 : 56} /> : null}
      {illustration.staff?.length ? (
        <StaffNotes
          notes={illustration.staff}
          clef={illustration.clef}
          preferFlats={illustration.flats}
          width={Math.max(200, Math.min(width - 32, 120 + illustration.staff.length * 44))}
          height={h}
        />
      ) : null}
      {layout ? <PianoKeyboard layout={layout} height={compact ? 80 : 100} hints={hints} notation={notation} /> : null}
    </View>
  );
}
