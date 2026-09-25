# CCB Piano

App (Android, iOS e web) para aprender **teclado e órgão** com os **hinos da CCB**
e o **MOR — Método de Estudos para Órgão Eletrônico**.

A experiência de tocar é inspirada no Simply Piano: as notas caem sobre um
teclado, o app **escuta** o que o aluno toca (teclado na tela, teclado MIDI ou
microfone) e, no modo **Aprender**, **para e espera** até o aluno tocar a nota
certa. A trilha de lições (explicação → ouvir → praticar → tocar, estrelas,
sequência de dias) segue a mesma ideia de apps como o Artie e o Simply Piano,
sem instrutor de IA.

## O que já funciona

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
- **Trilha gamificada baseada no MOR (Volume 1)**: 23 níveis com lições curtas —
  explicações ilustradas, percepção auditiva (ouvir e responder), quizzes,
  leitura de notas na pauta tocando no teclado, leitura rítmica com
  metrônomo e estudos com partitura. Lições liberadas em sequência, com estrelas.

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
    (tabs)/            Trilha • Hinos • Ajustes
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
  components/          Teclado, notas caindo, partitura, UI
  features/            Player e atividades (quiz, ouvir, encontrar a nota)
  store/               Ajustes e progresso (persistidos)
```

Leia também:

- [`docs/CONTEUDO.md`](docs/CONTEUDO.md) — como cadastrar hinos, exercícios e lições.
- [`docs/PLANO_MOR.md`](docs/PLANO_MOR.md) — plano de integração do MOR e próximos passos.
