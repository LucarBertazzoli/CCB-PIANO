import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { lessonSong } from '@/content/trilha';
import { PracticePlayer } from '@/features/player/PracticePlayer';
import { usePalette, useType } from '@/theme';

/** Lição da trilha: abre na mesma tela de tocar dos hinos, com o nome da lição. */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = lessonSong(id);
  const pal = usePalette();
  const type = useType();

  if (!song) {
    return (
      <View style={{ flex: 1, backgroundColor: pal.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[type.regular, { color: pal.text }]}>Lição em preparação.</Text>
      </View>
    );
  }
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <PracticePlayer key={song.id} song={song} onExit={exit} />;
}
