import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { getSong } from '@/content';
import { PracticePlayer } from '@/features/player/PracticePlayer';
import { font } from '@/theme';

/** Abre o hino direto na tela de tocar (os ajustes ficam no painel do player). */
export default function PlayHymnScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const song = getSong(songId);

  if (!song) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontFamily: font }}>Hino não encontrado.</Text>
      </View>
    );
  }
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <PracticePlayer key={song.id} song={song} onExit={exit} />;
}
