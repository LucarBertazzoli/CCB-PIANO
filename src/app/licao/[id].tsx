import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { lessonSong, nextLesson } from '@/content/trilha';
import { PracticePlayer } from '@/features/player/PracticePlayer';
import { useSettings } from '@/store/settings';
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
  // Guarda a melhor nota da lição (libera a próxima com 1 estrela).
  const finish = (stars: number) => {
    const { lessonStars, set } = useSettings.getState();
    if (stars > (lessonStars[id] ?? 0)) set({ lessonStars: { ...lessonStars, [id]: stars } });
  };
  const after = nextLesson(id);
  const next = after
    ? { label: after.title, onPress: () => router.replace({ pathname: '/licao/[id]', params: { id: after.id } }) }
    : undefined;
  return <PracticePlayer key={song.id} song={song} onExit={exit} onFinish={finish} next={next} />;
}
