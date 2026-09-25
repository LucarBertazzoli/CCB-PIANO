import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fitRange, keyboardLayout } from '@/components/keyboard-layout';
import { HymnScore } from '@/components/HymnScore';
import { NoteHighway } from '@/components/NoteHighway';
import { PianoKeyboard } from '@/components/PianoKeyboard';
import { SheetMusic } from '@/components/SheetMusic';
import { Button, Chip, Stars } from '@/components/ui';
import type { HandSelection, Song, Voice } from '@/content/types';
import type { PracticeMode } from '@/engine/practice-session';
import type { ScoreSummary } from '@/engine/scoring';
import { inputHub } from '@/input/input-hub';
import { noteName } from '@/music/theory';
import { useSettings, type ViewMode } from '@/store/settings';
import { colors, radius } from '@/theme';

import { usePractice } from './use-practice';

export interface PracticePlayerProps {
  song: Song;
  initialHands: HandSelection;
  initialMode: PracticeMode;
  initialTempo?: number;
  sectionId?: string;
  /** Em lições, trava mão/modo para seguir o roteiro. */
  locked?: boolean;
  title?: string;
  onExit: () => void;
  onFinished?: (score: ScoreSummary, mode: PracticeMode) => void;
  /** Texto do botão principal na tela de resultado (ex.: “Continuar”). */
  continueLabel?: string;
  onContinue?: (score: ScoreSummary) => void;
  /** Força a visualização inicial (partitura ou notas caindo). */
  view?: ViewMode;
  /** Pautas a mostrar na partitura. */
  staves?: 'grand' | 'treble' | 'bass';
  /** Exercício de ritmo: qualquer tecla vale e o metrônomo fica ligado. */
  rhythmOnly?: boolean;
  /** Dica curta mostrada na tela antes de começar. */
  hint?: string;
  /** Vozes que o aluno toca (as outras soam como acompanhamento). */
  voices?: Voice[];
  /** Se retornar uma mensagem, o botão “Continuar” fica bloqueado e a mensagem aparece. */
  continueBlockedReason?: (score: ScoreSummary) => string | null;
}

const MODE_LABEL: Record<PracticeMode, string> = { wait: 'Aprender', rhythm: 'Tocar', demo: 'Ouvir' };
const HAND_LABEL: Record<HandSelection, string> = { right: 'M. direita', left: 'M. esquerda', both: 'Ambas' };
const TEMPOS = [0.5, 0.75, 1];

export function PracticePlayer(props: PracticePlayerProps) {
  const { song, locked, onExit } = props;
  const [hands, setHands] = useState<HandSelection>(props.initialHands);
  const [mode, setMode] = useState<PracticeMode>(props.initialMode);
  const [tempoFactor, setTempoFactor] = useState(props.initialTempo ?? 1);

  const settings = useSettings();
  const [localView, setLocalView] = useState<ViewMode | null>(props.view ?? null);
  const viewMode = localView ?? settings.viewMode;
  const setView = (next: ViewMode) => {
    if (localView) setLocalView(next);
    else settings.set({ viewMode: next });
  };
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const p = usePractice({
    song,
    hands,
    mode,
    tempoFactor,
    sectionId: props.sectionId,
    anyKey: props.rhythmOnly,
    forceMetronome: props.rhythmOnly,
    voices: props.voices,
  });

  const usableWidth = width - insets.left - insets.right;
  const layout = useMemo(() => {
    const [low, high] = fitRange(p.timeline.lowest, p.timeline.highest, usableWidth < 500 ? 10 : 15);
    return keyboardLayout(low, high, usableWidth);
  }, [p.timeline.lowest, p.timeline.highest, usableWidth]);

  const topBar = 50;
  const [panelOpen, setPanelOpen] = useState(false);
  // O teclado pode ser escondido (microfone/MIDI); nas notas caindo ele é sempre mostrado.
  const keyboardVisible = viewMode === 'falling' || settings.showKeyboard;
  const keyboardHeight = !keyboardVisible
    ? 0
    : viewMode === 'page'
      ? Math.max(80, Math.min(150, height * 0.22))
      : Math.max(90, Math.min(190, height * 0.28));
  const stageHeight = Math.max(120, height - insets.top - insets.bottom - topBar - keyboardHeight);

  const [inputError, setInputError] = useState<string | null>(inputHub.error);
  useEffect(() => inputHub.onStatusChange(() => setInputError(inputHub.error)), []);

  // Ativa a fonte de entrada escolhida (MIDI/microfone) enquanto o player está aberto.
  useEffect(() => {
    void inputHub.use(settings.inputSource, { micSensitivity: settings.micSensitivity });
    return () => inputHub.stop();
  }, [settings.inputSource, settings.micSensitivity]);

  const { onFinished } = props;
  const finishedMode = p.session.mode;
  useEffect(() => {
    if (p.score) onFinished?.(p.score, finishedMode);
  }, [p.score, onFinished, finishedMode]);

  const noteOn = useCallback((midi: number) => {
    inputHub.emit({ type: 'on', midi, velocity: 0.8, source: 'touch' });
  }, []);
  const noteOff = useCallback((midi: number) => {
    inputHub.emit({ type: 'off', midi, velocity: 0, source: 'touch' });
  }, []);

  const resultOf = useCallback((id: string) => p.session.resultOf(id), [p.session]);

  const blockedReason = p.score ? (props.continueBlockedReason?.(p.score) ?? null) : null;

  const waitingNames = p.status === 'waiting'
    ? [...p.hints.entries()]
        .filter(([, h]) => h.state === 'expected-left' || h.state === 'expected-right')
        .map(([m]) => noteName(m, settings.notation))
        .join(' + ')
    : '';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      {/* Barra superior (compacta para paisagem) */}
      <View style={[styles.topBar, { height: topBar }]}>
        <Pressable onPress={onExit} hitSlop={12} style={styles.iconBtn} accessibilityLabel="Sair">
          <Text style={styles.iconText}>✕</Text>
        </Pressable>
        <View style={styles.titleBox}>
          <Text numberOfLines={1} style={styles.title}>
            {props.title ?? song.title}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${p.progress * 100}%` }]} />
          </View>
        </View>

        {!locked && (
          <View style={styles.segment}>
            {(['wait', 'rhythm', 'demo'] as PracticeMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.segmentItem, mode === m && styles.segmentItemOn]}
                accessibilityState={{ selected: mode === m }}>
                <Text style={[styles.segmentText, mode === m && styles.segmentTextOn]}>{MODE_LABEL[m]}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {viewMode === 'sheet' ? null : (
          <View style={styles.segment}>
            <Pressable
              onPress={() => setView('falling')}
              style={[styles.segmentItem, viewMode === 'falling' && styles.segmentItemOn]}
              accessibilityLabel="Notas caindo">
              <Text style={[styles.segmentText, viewMode === 'falling' && styles.segmentTextOn]}>▮ Notas</Text>
            </Pressable>
            <Pressable
              onPress={() => setView('page')}
              style={[styles.segmentItem, viewMode === 'page' && styles.segmentItemOn]}
              accessibilityLabel="Partitura">
              <Text style={[styles.segmentText, viewMode === 'page' && styles.segmentTextOn]}>♪ Partitura</Text>
            </Pressable>
          </View>
        )}
        <Pressable onPress={() => setPanelOpen((o) => !o)} hitSlop={8} style={[styles.iconBtn, panelOpen && styles.iconBtnOn]} accessibilityLabel="Opções">
          <Text style={styles.iconText}>⚙</Text>
        </Pressable>
        <Pressable
          onPress={p.status === 'playing' || p.status === 'waiting' ? p.pause : p.start}
          hitSlop={12}
          style={[styles.iconBtn, styles.playBtn]}
          accessibilityLabel="Pausar ou continuar">
          <Text style={styles.iconText}>{p.status === 'playing' || p.status === 'waiting' ? '❚❚' : '▶'}</Text>
        </Pressable>
      </View>

      {/* Área das notas */}
      <View style={{ height: stageHeight }}>
        {viewMode === 'page' ? (
          <HymnScore
            width={usableWidth}
            height={stageHeight}
            song={song}
            timeline={p.timeline}
            time={p.time}
            resultOf={resultOf}
            version={p.version}
          />
        ) : viewMode === 'falling' ? (
          <NoteHighway
            layout={layout}
            height={stageHeight}
            notes={p.timeline.notes}
            barLines={p.timeline.barLines}
            pps={settings.fallSpeed}
            time={p.time}
            resultOf={resultOf}
            version={p.version}
            notation={settings.notation}
            labelMode={settings.noteLabels}
          />
        ) : (
          <SheetMusic
            width={usableWidth}
            height={stageHeight}
            timeline={p.timeline}
            keySignature={song.keySignature}
            timeSignature={song.showTimeSignature === false ? null : song.timeSignature}
            staves={props.staves}
            time={p.time}
            resultOf={resultOf}
            version={p.version}
          />
        )}

        {p.feedback && mode === 'rhythm' ? (
          <Animated.Text
            key={p.feedback.id}
            entering={ZoomIn.duration(120)}
            exiting={FadeOut.duration(300)}
            style={[styles.feedback, { color: p.feedback.kind === 'good' ? colors.success : colors.danger }]}>
            {p.feedback.text}
          </Animated.Text>
        ) : null}

        {p.status === 'waiting' && waitingNames ? (
          <View style={styles.waitBadge} pointerEvents="none">
            <Text style={styles.waitText}>Toque {waitingNames}</Text>
          </View>
        ) : null}

        {inputError ? (
          <View style={styles.errorBadge} pointerEvents="none">
            <Text style={styles.errorText}>{inputError}</Text>
          </View>
        ) : null}

        {panelOpen && (
          <View style={styles.panel}>
            {!locked && (
              <View style={styles.panelRow}>
                <Text style={styles.panelLabel}>Mãos</Text>
                {(['right', 'left', 'both'] as HandSelection[]).map((h) => (
                  <Chip key={h} compact label={HAND_LABEL[h]} selected={hands === h} onPress={() => setHands(h)} />
                ))}
              </View>
            )}
            <View style={styles.panelRow}>
              <Text style={styles.panelLabel}>Andamento</Text>
              {TEMPOS.map((t) => (
                <Chip key={t} compact label={`${Math.round(t * 100)}%`} selected={tempoFactor === t} onPress={() => setTempoFactor(t)} />
              ))}
            </View>
            <View style={styles.panelRow}>
              <Text style={styles.panelLabel}>Som</Text>
              <Chip compact label="Piano" selected={settings.instrument === 'piano'} onPress={() => settings.set({ instrument: 'piano' })} />
              <Chip compact label="Órgão" selected={settings.instrument === 'organ'} onPress={() => settings.set({ instrument: 'organ' })} />
            </View>
            <View style={styles.panelRow}>
              <Text style={styles.panelLabel}>Metrônomo</Text>
              <Switch value={settings.metronome} onValueChange={(v) => settings.set({ metronome: v })} />
              <Text style={styles.panelLabel}>Acompanhamento</Text>
              <Switch value={settings.playAccompaniment} onValueChange={(v) => settings.set({ playAccompaniment: v })} />
            </View>
            <View style={styles.panelRow}>
              <Text style={styles.panelLabel}>Teclado na tela</Text>
              <Switch value={settings.showKeyboard} onValueChange={(v) => settings.set({ showKeyboard: v })} />
              <Text style={styles.panelHint}>Esconda para ver mais partitura (usando microfone ou MIDI).</Text>
            </View>
          </View>
        )}

        {(p.status === 'ready' || p.status === 'paused') && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>
              {p.status === 'ready' ? MODE_LABEL[mode] : 'Pausado'}
            </Text>
            <Text style={styles.overlayText}>
              {p.status === 'paused'
                ? 'Respire, e continue quando estiver pronto.'
                : (props.hint ??
                  (mode === 'wait'
                    ? 'As notas esperam você tocar. Sem pressa!'
                    : mode === 'rhythm'
                      ? 'Toque cada nota quando ela chegar ao teclado.'
                      : 'Veja e ouça como a música é tocada.'))}
            </Text>
            <View style={styles.row}>
              <Button title={p.status === 'ready' ? 'Começar' : 'Continuar'} onPress={p.start} />
              {p.status === 'paused' && <Button title="Recomeçar" variant="secondary" onPress={() => { p.restart(); p.start(); }} />}
            </View>
          </View>
        )}

        {p.status === 'finished' && p.score && (
          <View style={styles.overlay}>
            {mode === 'demo' ? (
              <Text style={styles.overlayTitle}>Agora é a sua vez!</Text>
            ) : (
              <>
                <Stars count={p.score.stars} size={44} />
                <Text style={styles.overlayTitle}>{Math.round(p.score.accuracy * 100)}% de precisão</Text>
                <Text style={styles.overlayText}>
                  {p.score.hits}/{p.score.total} notas • maior sequência {p.score.bestStreak}
                  {p.score.wrong ? ` • ${p.score.wrong} erradas` : ''}
                </Text>
              </>
            )}
            {blockedReason ? <Text style={styles.overlayText}>{blockedReason}</Text> : null}
            <View style={styles.row}>
              <Button title="Tentar de novo" variant="secondary" onPress={() => { p.restart(); p.start(); }} />
              {props.onContinue && !blockedReason && (
                <Button title={props.continueLabel ?? 'Continuar'} onPress={() => props.onContinue?.(p.score!)} />
              )}
            </View>
          </View>
        )}
      </View>

      {keyboardVisible ? (
      <PianoKeyboard
        layout={layout}
        height={keyboardHeight}
        hints={p.hints}
        notation={settings.notation}
        showLabels={settings.showKeyLabels}
        onNoteOn={noteOn}
        onNoteOff={noteOff}
      />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  titleBox: { flex: 1, minWidth: 110, gap: 4 },
  iconBtnOn: { backgroundColor: colors.primary },
  playBtn: { backgroundColor: colors.primaryDark },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  segmentItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  segmentItemOn: { backgroundColor: colors.primary },
  segmentText: { color: colors.textDim, fontWeight: '700', fontSize: 13 },
  segmentTextOn: { color: '#fff' },
  panel: {
    position: 'absolute',
    top: 6,
    right: 8,
    zIndex: 20,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
    maxWidth: 560,
  },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  panelLabel: { color: colors.text, fontWeight: '700', fontSize: 13, minWidth: 70 },
  panelHint: { color: colors.textDim, fontSize: 11, flexShrink: 1 },
  title: { color: colors.text, fontWeight: '700', fontSize: 14 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.card, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.success },
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  feedback: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    fontSize: 28,
    fontWeight: '900',
  },
  waitBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  waitText: { color: colors.text, fontWeight: '700' },
  errorBadge: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,90,95,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    maxWidth: '90%',
  },
  errorText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,18,32,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  overlayTitle: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  overlayText: { color: colors.textDim, fontSize: 15, textAlign: 'center', maxWidth: 420 },
});
