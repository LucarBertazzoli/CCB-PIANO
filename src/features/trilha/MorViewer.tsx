import * as WebBrowser from 'expo-web-browser';
import { createElement } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { morPreviewUrl, morViewUrl, type MorFile } from '@/content/mor-tipos';
import { RoundButton } from '@/features/player/controls';
import { usePalette, useType } from '@/theme';

/**
 * Abre um material da CCB. No navegador ele aparece aqui dentro, por cima da
 * trilha; no celular abre no navegador do próprio app.
 */
export function openMor(file: MorFile, show: (f: MorFile) => void) {
  if (Platform.OS === 'web') show(file);
  else void WebBrowser.openBrowserAsync(morViewUrl(file));
}

export function MorViewer({ file, onClose }: { file: MorFile; onClose: () => void }) {
  const p = usePalette();
  const t = useType();
  const insets = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: p.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.bar}>
        <RoundButton icon="close" size={38} onPress={onClose} accessibilityLabel="Fechar" />
        <Text style={[t.bold, styles.title, { color: p.text }]} numberOfLines={1}>
          {file.title}
        </Text>
        <Pressable
          onPress={() => void Linking.openURL(morViewUrl(file))}
          accessibilityRole="link"
          accessibilityLabel="Abrir em outra aba"
          hitSlop={8}
          style={styles.external}>
          <Icon name="external" size={18} color={p.textDim} />
        </Pressable>
      </View>
      <View style={[styles.frame, { borderColor: p.border, backgroundColor: p.surface }]}>
        {/* Aparece só enquanto o Drive não desenha o arquivo por cima. */}
        <Text style={[t.regular, styles.hint, { color: p.textDim }]}>
          Carregando o material da CCB… Se não abrir, toque no botão do canto para abrir em outra aba.
        </Text>
        {createElement('iframe', {
          src: morPreviewUrl(file),
          title: file.title,
          allow: 'autoplay; fullscreen',
          style: { position: 'absolute', inset: 0, border: 0, width: '100%', height: '100%', background: 'transparent' },
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 50, paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 15 },
  external: { padding: 8 },
  frame: { flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32, maxWidth: 460 },
});
