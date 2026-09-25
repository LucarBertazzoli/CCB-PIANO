import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Text } from 'react-native';

import { getSong } from '@/content';
import type { HandSelection, Voice } from '@/content/types';
import type { PracticeMode } from '@/engine/practice-session';
import type { ScoreSummary } from '@/engine/scoring';
import { PracticePlayer } from '@/features/player/PracticePlayer';
import { useProgress } from '@/store/progress';

const HANDS: HandSelection[] = ['right', 'left', 'both'];
const MODES: PracticeMode[] = ['wait', 'rhythm', 'demo'];

/** Tocar uma música livremente (fora das lições). */
export default function PlaySongScreen() {
  const params = useLocalSearchParams<{
    songId: string;
    hands?: string;
    mode?: string;
    section?: string;
    view?: string;
    voices?: string;
  }>();
  const song = getSong(params.songId);
  const hands = HANDS.includes(params.hands as HandSelection) ? (params.hands as HandSelection) : 'right';
  const mode = MODES.includes(params.mode as PracticeMode) ? (params.mode as PracticeMode) : 'wait';
  const view = params.view === 'falling' ? 'falling' : params.view === 'page' ? 'page' : undefined;
  const voices = useMemo(
    () => (params.voices ? (params.voices.split(',') as Voice[]) : undefined),
    [params.voices],
  );
  const recordSongResult = useProgress((s) => s.recordSongResult);
  const addPracticeTime = useProgress((s) => s.addPracticeTime);

  const onFinished = useCallback(
    (score: ScoreSummary, playedMode: PracticeMode) => {
      if (!song) return;
      if (playedMode !== 'demo') recordSongResult(song.id, score.stars, score.accuracy);
      addPracticeTime(song.notes.reduce((t, n) => Math.max(t, n.start + n.duration), 0) * (60 / song.tempo));
    },
    [song, recordSongResult, addPracticeTime],
  );

  if (!song) return <Text style={{ color: '#fff', padding: 24 }}>Música não encontrada.</Text>;

  return (
    <PracticePlayer
      song={song}
      initialHands={hands}
      initialMode={mode}
      sectionId={params.section}
      view={view}
      voices={voices}
      onExit={() => router.back()}
      onFinished={onFinished}
    />
  );
}
