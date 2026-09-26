import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HymnScore } from '@/components/HymnScore';
import { fitRange, keyboardLayout } from '@/components/keyboard-layout';
import { NoteHighway } from '@/components/NoteHighway';
import { PedalBoard } from '@/components/PedalBoard';
import { PianoKeyboard } from '@/components/PianoKeyboard';
import type { Song, Voice } from '@/content/types';
import type { PracticeMode } from '@/engine/practice-session';
import { inputHub } from '@/input/input-hub';
import type { InputSourceKind, KeyTarget } from '@/input/types';
import { noteName } from '@/music/theory';
import { useSettings } from '@/store/settings';
import { font, usePalette } from '@/theme';

import { Choices, Glass, Label, MultiChoices, Pill, RoundButton, Row, Toggle, Underline } from './controls';
import { usePractice } from './use-practice';

export interface PracticePlayerProps {
  song: Song;
  onExit: () => void;
}

type Part = 'right' | 'left' | 'pedal';
type Detail = null | 'voices' | 'loop' | 'input' | 'keyboard';

const PART_VOICES: Record<Part, Voice[]> = {
  right: ['soprano', 'alto'],
  left: ['tenor', 'bass'],
  pedal: ['pedal'],
};
const VOICE_LABEL: Record<Voice, string> = {
  soprano: 'Soprano',
  alto: 'Contralto',
  tenor: 'Tenor',
  bass: 'Baixo',
  pedal: 'Pedaleira',
};
const SOURCE_LABEL: Record<InputSourceKind, string> = { touch: 'Tela', midi: 'Teclado MIDI', mic: 'Microfone' };
const APP_YOU = [
  { value: 'app' as const, label: 'App' },
  { value: 'you' as const, label: 'Você' },
];

/**
 * Tela de tocar um hino. Enquanto toca: só a música e o teclado. Ao pausar,
 * abre o painel de ajustes (inspirado no Artie) com tudo o que é preciso.
 */
export function PracticePlayer({ song, onExit }: PracticePlayerProps) {
  const settings = useSettings();
  const pal = usePalette();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const organ = settings.instrument === 'organ';

  // ------------------------------------------------------------- o que o aluno toca
  const [parts, setParts] = useState<Record<Part, boolean>>({ right: true, left: true, pedal: false });
  const [customVoices, setCustomVoices] = useState<Voice[] | null>(null);
  const [waitMode, setWaitMode] = useState(true);
  const [bpm, setBpm] = useState(song.tempo);
  const [bpmText, setBpmText] = useState(String(song.tempo));
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [loop, setLoop] = useState(false);

  const voices = useMemo<Voice[]>(() => {
    const chosen = customVoices ?? (Object.keys(parts) as Part[]).filter((k) => parts[k]).flatMap((k) => PART_VOICES[k]);
    return organ ? chosen : chosen.filter((v) => v !== 'pedal');
  }, [customVoices, parts, organ]);
  const mode: PracticeMode = voices.length === 0 ? 'demo' : waitMode ? 'wait' : 'rhythm';

  const p = usePractice({
    song,
    hands: 'both',
    mode,
    tempoFactor: bpm / song.tempo,
    sectionId,
    voices: voices.length ? voices : undefined,
  });

  const changeBpm = (value: number) => {
    const v = Math.max(20, Math.min(220, Math.round(value)));
    setBpm(v);
    setBpmText(String(v));
  };

  // ------------------------------------------------------------- painel
  const [panelState, setPanel] = useState(true);
  const [detail, setDetail] = useState<Detail>(null);
  const playing = p.status === 'playing' || p.status === 'waiting';
  const openPanel = () => {
    p.pause();
    setPanel(true);
  };
  const play = () => {
    setPanel(false);
    setDetail(null);
    if (p.status === 'finished') p.restart();
    p.start();
  };
  const toggleDetail = (d: Detail) => setDetail((cur) => (cur === d ? null : d));

  // Ao terminar: repete o trecho ou volta ao painel.
  const { status, restart, start } = p;
  const panel = panelState || (status === 'finished' && !loop);
  useEffect(() => {
    if (status !== 'finished' || !loop) return;
    restart();
    start();
  }, [status, loop, restart, start]);

  // ------------------------------------------------------------- entrada (tela/MIDI/microfone)
  const [inputError, setInputError] = useState<string | null>(inputHub.error);
  const [heard, setHeard] = useState<number | null>(null);
  useEffect(() => inputHub.onStatusChange(() => setInputError(inputHub.error)), []);
  useEffect(() => {
    void inputHub.use(settings.inputSource, { micSensitivity: settings.micSensitivity });
    return () => inputHub.stop();
  }, [settings.inputSource, settings.micSensitivity]);
  useEffect(
    () =>
      inputHub.subscribe((e) => {
        if (e.type === 'on') setHeard(e.midi);
      }),
    [],
  );

  const handlers = useMemo(() => {
    const make = (target: KeyTarget) => ({
      on: (midi: number) => inputHub.emit({ type: 'on', midi, velocity: 0.8, source: 'touch', target }),
      off: (midi: number) => inputHub.emit({ type: 'off', midi, velocity: 0, source: 'touch', target }),
    });
    return { main: make('main'), upper: make('upper'), lower: make('lower'), pedal: make('pedal') };
  }, []);

  // ------------------------------------------------------------- teclados
  const usableWidth = width - insets.left - insets.right;
  const hasPedal = organ && p.song.notes.some((n) => n.voice === 'pedal');
  const viewMode = settings.viewMode;
  const tlNotes = p.timeline.notes;
  const ranges = useMemo(() => {
    const ms = tlNotes.filter((n) => n.voice !== 'pedal').map((n) => n.midi);
    const pedalMs = tlNotes.filter((n) => n.voice === 'pedal').map((n) => n.midi);
    return {
      manual: ms.length ? ([Math.min(...ms), Math.max(...ms)] as const) : ([48, 72] as const),
      pedal: pedalMs.length ? ([Math.min(36, ...pedalMs), Math.max(48, ...pedalMs)] as const) : ([36, 48] as const),
    };
  }, [tlNotes]);
  const keyPx = settings.keySize === 'large' ? 40 : settings.keySize === 'small' ? 20 : 28;
  const minWhite = Math.max(10, Math.min(36, Math.floor(usableWidth / keyPx)));
  // Os dois manuais usam a mesma extensão: assim as notas caindo alinham com os dois.
  const layout = useMemo(() => {
    const [low, high] = fitRange(ranges.manual[0], ranges.manual[1], minWhite);
    return keyboardLayout(low, high, usableWidth);
  }, [ranges, minWhite, usableWidth]);

  const keyboardVisible = viewMode === 'falling' || settings.showKeyboard;
  const twoManuals = hasPedal && settings.organManuals === 'two';
  const pedalVisible = keyboardVisible && hasPedal && settings.showPedalboard;
  const pedalHeight = pedalVisible ? Math.round(Math.max(28, Math.min(46, height * 0.09))) : 0;
  const manualHeight = !keyboardVisible
    ? 0
    : twoManuals
      ? Math.round(Math.max(44, Math.min(90, height * 0.125)))
      : Math.round(Math.max(70, Math.min(170, height * (viewMode === 'page' ? 0.2 : 0.24))));
  const consoleHeight = (twoManuals ? manualHeight * 2 + 2 : manualHeight) + pedalHeight;
  const stageHeight = Math.max(120, height - insets.top - insets.bottom - consoleHeight);
  const preferFlats = p.song.keySignature < 0;
  const highwayNotes = useMemo(() => tlNotes.filter((n) => n.voice !== 'pedal'), [tlNotes]);
  const session = p.session;
  const resultOf = useMemo(() => (id: string) => session.resultOf(id), [session]);

  // Aviso do modo espera: o que tocar e em qual teclado.
  const names = (map: ReadonlyMap<number, { state: string }>, state: string) =>
    [...map.entries()]
      .filter(([, h]) => h.state === state)
      .sort((a, b) => a[0] - b[0])
      .map(([m]) => noteName(m, settings.notation, { preferFlats }))
      .join(' + ');
  const waitText =
    p.status !== 'waiting'
      ? ''
      : [
          [twoManuals ? 'Superior' : 'Direita', names(p.hintSets.right, 'expected-right')],
          [twoManuals ? 'Inferior' : 'Esquerda', names(p.hintSets.left, 'expected-left')],
          ['Pedal', names(p.hintSets.pedal, 'expected-pedal')],
        ]
          .filter(([, n]) => n)
          .map(([k, n]) => `${k}: ${n}`)
          .join('   ·   ');

  // Linha do tempo: um tique por compasso.
  const ticks = p.timeline.measureStarts;
  const totalBeats = ticks[ticks.length - 1] || 1;

  const setPart = (part: Part, you: boolean) => {
    setCustomVoices(null);
    setParts((prev) => ({ ...prev, [part]: you }));
  };
  const toggleVoice = (v: Voice) => {
    const cur = customVoices ?? voices;
    setCustomVoices(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  const partValue = (part: Part) =>
    PART_VOICES[part].some((v) => voices.includes(v)) ? ('you' as const) : ('app' as const);
  const mark = song.tempoMark;
  const onPaper = viewMode === 'page';

  const s = styles;
  return (
    <View
      style={[
        s.root,
        { backgroundColor: pal.bg, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
      ]}>
      {/* ---------------------------------------------------- música */}
      <View style={{ height: stageHeight }}>
        {onPaper ? (
          <HymnScore width={usableWidth} height={stageHeight} song={p.song} timeline={p.timeline} time={p.time} resultOf={resultOf} version={p.version} />
        ) : (
          <NoteHighway
            layout={layout}
            height={stageHeight}
            notes={highwayNotes}
            barLines={p.timeline.barLines}
            pps={settings.fallSpeed}
            time={p.time}
            resultOf={resultOf}
            version={p.version}
            notation={settings.notation}
            labelMode={settings.noteLabels}
            preferFlats={preferFlats}
          />
        )}

        {/* Controles discretos enquanto toca */}
        {!panel || playing ? (
          <View style={s.floating} pointerEvents="box-none">
            <RoundButton label="❚❚" size={36} onPress={openPanel} accessibilityLabel="Pausar e abrir ajustes" />
            <View style={[s.miniTrack, { backgroundColor: onPaper ? 'rgba(0,0,0,0.10)' : pal.surfaceStrong }]}>
              <View style={[s.miniFill, { width: `${p.progress * 100}%`, backgroundColor: onPaper ? '#111111' : pal.text }]} />
            </View>
          </View>
        ) : null}

        {waitText && !panel ? (
          <View style={[s.waitBadge, { backgroundColor: pal.surface, borderColor: pal.border }]} pointerEvents="none">
            <Text style={[s.waitText, { color: pal.text }]}>{waitText}</Text>
          </View>
        ) : null}

        {p.feedback && mode === 'rhythm' && !panel ? (
          <Animated.Text
            key={p.feedback.id}
            entering={ZoomIn.duration(120)}
            exiting={FadeOut.duration(300)}
            style={[s.feedback, { color: onPaper ? '#111111' : pal.text }]}>
            {p.feedback.text}
          </Animated.Text>
        ) : null}
      </View>

      {/* ---------------------------------------------------- teclados */}
      {keyboardVisible ? (
        <View>
          {twoManuals ? (
            <>
              <PianoKeyboard layout={layout} height={manualHeight} hints={p.hintSets.right} notation={settings.notation} showLabels={settings.showKeyLabels} preferFlats={preferFlats} tag="SUPERIOR" onNoteOn={handlers.upper.on} onNoteOff={handlers.upper.off} />
              <View style={s.manualGap} />
              <PianoKeyboard layout={layout} height={manualHeight} hints={p.hintSets.left} notation={settings.notation} showLabels={settings.showKeyLabels} preferFlats={preferFlats} tag="INFERIOR" onNoteOn={handlers.lower.on} onNoteOff={handlers.lower.off} />
            </>
          ) : (
            <PianoKeyboard layout={layout} height={manualHeight} hints={p.hints} notation={settings.notation} showLabels={settings.showKeyLabels} preferFlats={preferFlats} onNoteOn={handlers.main.on} onNoteOff={handlers.main.off} />
          )}
          {pedalVisible ? (
            <PedalBoard width={usableWidth} height={pedalHeight} low={ranges.pedal[0]} high={ranges.pedal[1]} hints={p.hintSets.pedal} notation={settings.notation} preferFlats={preferFlats} onNoteOn={handlers.pedal.on} onNoteOff={handlers.pedal.off} />
          ) : null}
        </View>
      ) : null}

      {/* ---------------------------------------------------- painel de ajustes (pausado) */}
      {panel && !playing ? (
        <Animated.View entering={FadeIn.duration(150)} style={[StyleSheet.absoluteFill, s.scrim]}>
          <ScrollView
            contentContainerStyle={[
              s.panel,
              { paddingTop: insets.top + 12, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 },
            ]}>
            {/* Linha 1: voltar · hino e linha do tempo · tocar */}
            <View style={s.line}>
              <RoundButton label="‹" onPress={onExit} accessibilityLabel="Voltar ao hinário" />
              <Glass style={s.timelineBox}>
                <View style={s.titleRow}>
                  <Text style={[s.hymnTitle, { color: pal.text }]} numberOfLines={1}>
                    {song.hymnNumber ? `${song.hymnNumber}  ` : ''}
                    {song.title}
                  </Text>
                  {p.status === 'finished' && p.score && mode !== 'demo' ? (
                    <Text style={[s.result, { color: pal.text }]}>
                      {'★'.repeat(p.score.stars)}
                      {'☆'.repeat(3 - p.score.stars)} {Math.round(p.score.accuracy * 100)}%
                    </Text>
                  ) : null}
                </View>
                <View style={s.ticks}>
                  <View style={[s.axis, { backgroundColor: pal.border }]} />
                  {ticks.slice(0, -1).map((b, i) => (
                    <View key={i} style={[s.tick, { left: `${(b / totalBeats) * 100}%`, backgroundColor: pal.textDim }]} />
                  ))}
                  <View style={[s.marker, { left: `${p.progress * 100}%`, backgroundColor: pal.primary }]} />
                </View>
              </Glass>
              <RoundButton label="▶" active onPress={play} accessibilityLabel={p.status === 'paused' ? 'Continuar' : 'Começar'} />
            </View>

            {/* Linha 2: vozes · andamento · metrônomo · trecho */}
            <View style={s.line}>
              <Pill label="Vozes" icon="✋✋" active={detail === 'voices'} onPress={() => toggleDetail('voices')} />
              <View style={s.tempo}>
                <RoundButton label="−" onPress={() => changeBpm(bpm - 2)} accessibilityLabel="Diminuir andamento" />
                <View style={s.tempoValue}>
                  <TextInput
                    value={bpmText}
                    onChangeText={(t) => setBpmText(t.replace(/\D/g, '').slice(0, 3))}
                    onBlur={() => changeBpm(parseInt(bpmText, 10) || bpm)}
                    onSubmitEditing={() => changeBpm(parseInt(bpmText, 10) || bpm)}
                    keyboardType="number-pad"
                    style={[s.tempoInput, { color: pal.text }]}
                    accessibilityLabel="Andamento em semínimas por minuto"
                  />
                  <Text style={[s.tempoLabel, { color: pal.textDim }]}>Andamento ♩</Text>
                </View>
                <RoundButton label="+" onPress={() => changeBpm(bpm + 2)} accessibilityLabel="Aumentar andamento" />
              </View>
              <RoundButton label="♪" active={settings.metronome} onPress={() => settings.set({ metronome: !settings.metronome })} accessibilityLabel="Metrônomo" />
              <Pill
                label={sectionId ? (song.sections?.find((x) => x.id === sectionId)?.label ?? 'Trecho') : 'Trecho'}
                icon="⟲"
                active={detail === 'loop'}
                onPress={() => toggleDetail('loop')}
              />
            </View>

            {/* Cartões (ou o detalhe aberto) */}
            {detail === 'voices' ? (
              <Glass style={s.pad}>
                <Label>Vozes que você toca</Label>
                <MultiChoices<Voice>
                  options={(['soprano', 'alto', 'tenor', 'bass', ...(organ ? (['pedal'] as Voice[]) : [])] as Voice[]).map((v) => ({ value: v, label: VOICE_LABEL[v] }))}
                  values={voices}
                  onToggle={toggleVoice}
                />
                <Label dim>
                  {voices.length
                    ? 'As outras vozes tocam junto com você.'
                    : 'Nenhuma voz escolhida: o app toca o hino inteiro para você ouvir.'}
                </Label>
              </Glass>
            ) : detail === 'loop' ? (
              <Glass style={s.pad}>
                <Label>Trecho</Label>
                <Choices<string>
                  options={[{ value: '', label: 'Hino inteiro' }, ...(song.sections ?? []).map((x) => ({ value: x.id, label: x.label }))]}
                  value={sectionId ?? ''}
                  onChange={(v) => setSectionId(v || undefined)}
                />
                <Row label="Repetir sem parar" icon="⟲" last>
                  <Toggle value={loop} onChange={setLoop} label="Repetir sem parar" />
                </Row>
              </Glass>
            ) : detail === 'input' ? (
              <Glass style={s.pad}>
                <Label>Como o app ouve você</Label>
                <Choices<InputSourceKind>
                  options={(['touch', 'midi', 'mic'] as InputSourceKind[]).map((v) => ({ value: v, label: SOURCE_LABEL[v] }))}
                  value={settings.inputSource}
                  onChange={(v) => settings.set({ inputSource: v })}
                />
                {settings.inputSource === 'mic' ? (
                  <>
                    <Label dim>Sensibilidade do microfone</Label>
                    <Choices<number>
                      options={[
                        { value: 0.02, label: 'Baixa' },
                        { value: 0.01, label: 'Média' },
                        { value: 0.004, label: 'Alta' },
                      ]}
                      value={settings.micSensitivity}
                      onChange={(v) => settings.set({ micSensitivity: v })}
                    />
                  </>
                ) : null}
                <Row label="Teste: toque uma nota" last>
                  <Text style={[s.heard, { color: inputError ? pal.textDim : pal.text }]} numberOfLines={2}>
                    {inputError ?? (heard !== null ? noteName(heard, settings.notation, { withOctave: true, preferFlats }) : '—')}
                  </Text>
                </Row>
              </Glass>
            ) : detail === 'keyboard' ? (
              <Glass style={s.pad}>
                <Row label="Instrumento">
                  <Choices options={[{ value: 'organ', label: 'Órgão' }, { value: 'piano', label: 'Piano' }]} value={settings.instrument} onChange={(v) => settings.set({ instrument: v as 'organ' | 'piano' })} />
                </Row>
                {organ ? (
                  <Row label="Manuais">
                    <Choices options={[{ value: 'two', label: 'Superior e inferior' }, { value: 'one', label: 'Um teclado' }]} value={settings.organManuals} onChange={(v) => settings.set({ organManuals: v as 'one' | 'two' })} />
                    <Label dim>Pedaleira</Label>
                    <Toggle value={settings.showPedalboard} onChange={(v) => settings.set({ showPedalboard: v })} label="Pedaleira" />
                  </Row>
                ) : null}
                <Row label="Teclas">
                  <Choices options={[{ value: 'large', label: 'Grandes' }, { value: 'medium', label: 'Médias' }, { value: 'small', label: 'Pequenas' }]} value={settings.keySize} onChange={(v) => settings.set({ keySize: v as 'large' | 'medium' | 'small' })} />
                </Row>
                <Row label="Nomes das notas">
                  <Choices options={[{ value: 'solfege', label: 'Dó Ré Mi' }, { value: 'letters', label: 'C D E' }]} value={settings.notation} onChange={(v) => settings.set({ notation: v as 'solfege' | 'letters' })} />
                  <Toggle value={settings.showKeyLabels} onChange={(v) => settings.set({ showKeyLabels: v })} label="Nomes nas teclas" />
                </Row>
                <Row label="Teclado junto da partitura">
                  <Toggle value={settings.showKeyboard} onChange={(v) => settings.set({ showKeyboard: v })} label="Teclado junto da partitura" />
                </Row>
                <Row label="Cores" last>
                  <Choices options={[{ value: 'mono', label: 'Preto e branco' }, { value: 'color', label: 'Colorido' }]} value={settings.colorMode} onChange={(v) => settings.set({ colorMode: v as 'mono' | 'color' })} />
                </Row>
              </Glass>
            ) : (
              <View style={s.cards}>
                <Glass style={s.card}>
                  <Row label="Mão esquerda" icon="✋">
                    <Underline options={APP_YOU} value={partValue('left')} onChange={(v) => setPart('left', v === 'you')} />
                  </Row>
                  <Row label="Mão direita" icon="✋" last={!organ}>
                    <Underline options={APP_YOU} value={partValue('right')} onChange={(v) => setPart('right', v === 'you')} />
                  </Row>
                  {organ ? (
                    <Row label="Pedaleira" icon="▭" last>
                      <Underline options={APP_YOU} value={partValue('pedal')} onChange={(v) => setPart('pedal', v === 'you')} />
                    </Row>
                  ) : null}
                </Glass>
                <Glass style={s.card}>
                  <Row label="Modo espera" icon="⏱">
                    <Toggle value={waitMode} onChange={setWaitMode} label="Modo espera" />
                  </Row>
                  <Row label="Acompanhamento" icon="♫" last>
                    <Toggle value={settings.playAccompaniment} onChange={(v) => settings.set({ playAccompaniment: v })} label="Acompanhamento" />
                  </Row>
                </Glass>
              </View>
            )}

            {/* Visualização + reconhecimento + teclado */}
            <Glass style={s.slim}>
              <Row label="Ver como">
                <Underline<'falling' | 'page'>
                  options={[
                    { value: 'falling', label: 'Notas' },
                    { value: 'page', label: 'Partitura' },
                  ]}
                  value={viewMode}
                  onChange={(v) => settings.set({ viewMode: v })}
                />
              </Row>
              <Row label="Reconhecimento de notas" onPress={() => toggleDetail('input')}>
                <Text style={[s.rowValue, { color: pal.text }]}>{SOURCE_LABEL[settings.inputSource]}</Text>
                <Text style={[s.chev, { color: pal.text }]}>›</Text>
              </Row>
              <Row label="Teclado e aparência" onPress={() => toggleDetail('keyboard')} last>
                <Text style={[s.rowValue, { color: pal.text }]}>
                  {organ ? 'Órgão' : 'Piano'} · {settings.colorMode === 'mono' ? 'Preto e branco' : 'Colorido'}
                </Text>
                <Text style={[s.chev, { color: pal.text }]}>›</Text>
              </Row>
            </Glass>

            <Text style={[s.footnote, { color: pal.textDim }]}>
              {mode === 'demo'
                ? 'O app toca o hino inteiro para você ouvir e acompanhar.'
                : waitMode
                  ? 'Modo espera: o hino para em cada nota até você tocar.'
                  : 'Sem espera: toque no andamento, como no culto.'}
              {mark ? `   Hinário: ${mark.unit === 'e' ? '♪' : mark.unit === 'h' ? '𝅗𝅥' : mark.unit === 'q.' ? '♩.' : '♩'} = ${mark.min}–${mark.max}` : ''}
            </Text>
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  floating: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: 3 },
  waitBadge: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  waitText: { fontFamily: font, fontSize: 13 },
  feedback: { position: 'absolute', alignSelf: 'center', top: '35%', fontFamily: font, fontSize: 26, fontWeight: '700' },
  manualGap: { height: 2, backgroundColor: '#000000' },
  scrim: { backgroundColor: 'rgba(0,0,0,0.74)' },
  panel: { gap: 12, paddingBottom: 24, maxWidth: 1000, width: '100%', alignSelf: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineBox: { flex: 1, paddingVertical: 8, paddingHorizontal: 18, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hymnTitle: { fontFamily: font, fontSize: 13, flex: 1 },
  result: { fontFamily: font, fontSize: 13 },
  ticks: { height: 18, justifyContent: 'center' },
  axis: { position: 'absolute', left: 0, right: 0, height: 1 },
  tick: { position: 'absolute', width: 1.5, height: 10, borderRadius: 1 },
  marker: { position: 'absolute', width: 10, height: 20, borderRadius: 5, marginLeft: -5 },
  tempo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  tempoValue: { alignItems: 'center', minWidth: 70 },
  tempoInput: { fontFamily: font, fontSize: 22, fontWeight: '700', textAlign: 'center', width: 70, padding: 0 },
  tempoLabel: { fontFamily: font, fontSize: 10 },
  cards: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, paddingVertical: 2, paddingHorizontal: 18 },
  pad: { gap: 10, paddingHorizontal: 18, paddingVertical: 14 },
  slim: { paddingVertical: 0, paddingHorizontal: 18 },
  rowValue: { fontFamily: font, fontSize: 14 },
  chev: { fontFamily: font, fontSize: 22 },
  heard: { fontFamily: font, fontSize: 16, fontWeight: '700', maxWidth: 360, textAlign: 'right' },
  footnote: { fontFamily: font, fontSize: 11, textAlign: 'center' },
});
