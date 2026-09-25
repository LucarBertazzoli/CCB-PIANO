# CCB Piano

App (Android, iOS e web) para aprender **teclado e órgão** com os **hinos da CCB**.
Funciona na **horizontal** (paisagem), como o Simply Piano.

A experiência de tocar é inspirada no Simply Piano: as notas caem sobre um
teclado, o app **escuta** o que o aluno toca (teclado na tela, teclado MIDI ou
microfone) e, no modo **Aprender**, **para e espera** até o aluno tocar a nota
certa. A trilha de lições (explicação → ouvir → praticar → tocar, estrelas,
sequência de dias) segue a mesma ideia de apps como o Artie e o Simply Piano,
sem instrutor de IA.

## O que já funciona

- **Hinário**: os 480 hinos pelo número; os que têm partitura cadastrada abrem
  para estudo (ver `docs/CONTEUDO.md`).
- **Partitura no formato do hinário da organista**: duas pautas, 4 vozes com
  hastes por voz, armadura, fórmula de compasso, ♩ = metrônomo, dedilhado,
  acidentes corretos por compasso, cursor que acompanha e página que rola sozinha.
- **Ou notas caindo** sobre o teclado — o aluno escolhe na hora.
- **Praticar por voz** (soprano, contralto, tenor, baixo), por mão ou o hino
  inteiro; as outras vozes tocam junto como acompanhamento.

- **Notas caindo** sobre o teclado, com cor por mão (azul = direita, roxo =
  esquerda), nome da nota ou número do dedo dentro de cada nota, linhas de
  compasso e guias de Dó/Fá.
- **Três modos**: *Ouvir* (demonstração), *Aprender* (espera o aluno — acordes
  exigem todas as notas) e *Tocar* (no andamento, com precisão, “Perfeito!/Bom!”
  e estrelas).
- **Praticar por mão** (a outra mão toca sozinha como acompanhamento), por
  **trecho** (linha/estrofe) e com **andamento** 50/75/100%.
- **Partitura** em pauta dupla rolando (prévia), alternável com as notas caindo.
- **Entradas**: teclado na tela (multitoque), **MIDI** (web — Chrome/Edge) e
  **microfone** (Android/iOS/web) com detecção de altura YIN em TypeScript puro.
- **Som** de piano e órgão sintetizado (sem arquivos de áudio), metrônomo.
- **Trilha de aprendizagem (oculta por enquanto)**: 23 níveis baseados no MOR,
  guardados em `src/content/courses/trilha.ts` e na rota `/trilha`.

## Rodando

```bash
npm install
npm run web          # navegador
npx expo run:android # build de desenvolvimento (necessário para microfone/áudio nativo)
npx expo run:ios
```

> O app usa `react-native-audio-api` (áudio e microfone nativos), então **não
> roda no Expo Go** — use um *development build* (`npx expo run:*` ou
> `eas build --profile development`).

Verificações:

```bash
npm run typecheck
npm run lint
npm test
```

## Arquitetura

```
src/
  app/                 Telas (Expo Router)
    (tabs)/            Hinos • Ajustes (Trilha oculta)
    licao/[id].tsx     Executa uma lição passo a passo
    hino/[songId].tsx  Detalhes da música (mãos, trecho, modo)
    tocar/[songId].tsx Player livre
  content/             Conteúdo como dados puros
    types.ts           Song, Lesson, Course, passos…
    notation.ts        Notação de texto para cadastrar músicas
    songs/             Exercícios, peças, hinos
    courses/trilha.ts  Trilha de aprendizagem (sequência do MOR)
  engine/              Regras do jogo, sem UI (100% testável)
    timeline.ts        Batidas → segundos, trechos, mãos ativas
    practice-session.ts Relógio, modo espera/ritmo/demo, acertos, erros
    scoring.ts         Precisão e estrelas
  input/               Entradas do aluno
    input-hub.ts       Ponto único: toque, MIDI e microfone
    pitch/             YIN + estabilizador de notas + processador
    midi-input*.ts     Web MIDI (nativo: a integrar)
    mic-input*.ts      Microfone (nativo e web)
  audio/synth.ts       Sintetizador de piano/órgão
  components/          Teclado, notas caindo, partitura (HymnScore), UI
  music/spelling.ts    Grafia das notas (armadura, ♯ ♭ ♮ por compasso)
  features/            Player e atividades (quiz, ouvir, encontrar a nota)
  store/               Ajustes e progresso (persistidos)
```

Leia também:

- [`docs/CONTEUDO.md`](docs/CONTEUDO.md) — como cadastrar hinos, exercícios e lições.
- [`docs/PLANO_MOR.md`](docs/PLANO_MOR.md) — plano de integração do MOR e próximos passos.
