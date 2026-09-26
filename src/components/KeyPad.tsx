import { useRef, type ReactNode } from 'react';
import { Platform, Pressable, View, type PointerEvent, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  onDown?: () => void;
  onUp?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: ReactNode;
}

/**
 * Área de uma tecla (ou pedal). No navegador responde no instante em que o
 * mouse/dedo desce — o `Pressable` da web só dispara depois de um pequeno
 * atraso e perdia os cliques rápidos (a tecla não soava). Aceita vários dedos.
 */
function WebKeyPad({ onDown, onUp, style, accessibilityLabel, children }: Props) {
  const pointers = useRef(new Set<number>());
  const release = (e: PointerEvent) => {
    if (pointers.current.delete(e.nativeEvent.pointerId) && pointers.current.size === 0) onUp?.();
  };
  return (
    <View
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPointerDown={(e) => {
        const first = pointers.current.size === 0;
        pointers.current.add(e.nativeEvent.pointerId);
        if (first) onDown?.();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      style={[style, WEB_KEY_STYLE]}>
      {children}
    </View>
  );
}

// Sem seleção de texto, sem rolagem da página ao tocar, cursor de mão.
const WEB_KEY_STYLE = { cursor: 'pointer', userSelect: 'none', touchAction: 'none' } as unknown as ViewStyle;

function NativeKeyPad({ onDown, onUp, style, accessibilityLabel, children }: Props) {
  return (
    <Pressable onPressIn={onDown} onPressOut={onUp} accessibilityLabel={accessibilityLabel} style={style}>
      {children}
    </Pressable>
  );
}

export const KeyPad = Platform.OS === 'web' ? WebKeyPad : NativeKeyPad;
