# CCB Piano

App (Android, iOS e web) para aprender **teclado e órgão** com os **hinos da CCB**.
Funciona na **horizontal** (paisagem), como o Simply Piano.

A experiência de tocar é inspirada no Simply Piano: as notas caem sobre um
teclado, o app **escuta** o que o aluno toca (teclado na tela, teclado MIDI ou
microfone) e, no modo **Aprender**, **para e espera** até o aluno tocar a nota
certa. Sem instrutor de IA.

Visual **minimalista em preto e branco** (fonte Verdana, a mesma do site da
CCB), com modo colorido opcional. São só duas telas:

1. **Entrada** — um campo para digitar o número ou o nome, a escolha entre
   *Hinos* e *Coros* e uma roda que gira até o número certo.
2. **Tocar** — o hino abre direto. Ao pausar, aparece o painel (inspirado no
   Artie): em cima, a **linha do tempo arrastável** (toque ou arraste para ir a
   qualquer compasso; ao tocar de novo há uma contagem antes do ponto) e os
   ajustes em abas:
   - **Prática** — quem toca cada mão e a pedaleira (App/Você), vozes, modo
     espera, acompanhamento, andamento digitável (− 72 +, 50/75/100%),
     metrônomo, trecho e repetição;
   - **Visualização** — Notas caindo ou Partitura, nomes das notas, teclado;
   - **Instrumento** — órgão ou piano, manuais, pedaleira, tamanho das teclas,
     volume;
   - **Ouvir você** — tela, teclado MIDI ou microfone, com teste ao vivo;
   - **Aparência** — fonte (Verdana, serifada ou OpenDyslexic) e cores: preto e
     branco (padrão) ou colorido, com a cor de cada parte (destaque, mãos,
     pedaleira, acerto, erro, fundo e papel) escolhida em amostras ou por
     código (#RRGGBB).

## O que já funciona

- **Hinário completo**: os 480 hinos e 6 coros do Hinário nº 5, com título,
  autor, tonalidade, compasso, metrônomo e as 4 vozes (importados de
  partituras digitais — ver `docs/CONTEUDO.md`).
- **Órgão no formato da organista**: 3 pautas (mão direita, mão esquerda e
  pedaleira), notas repetidas seguradas nas vozes internas e pedal a partir do
  baixo — conferido com o hinário de órgão impresso.
- **Partitura no formato do hinário da organista**: duas pautas, 4 vozes com
  hastes por voz, armadura, fórmula de compasso, ♩ = metrônomo, dedilhado,
  acidentes corretos por compasso, cursor que acompanha e página que rola sozinha.
- **Ou notas caindo** sobre o teclado — o aluno escolhe na hora.
- **Praticar por voz** (soprano, contralto, tenor, baixo), por mão ou o hino
  inteiro; as outras vozes tocam junto como acompanhamento.

- **Notas caindo** sobre o teclado, com nome da nota ou número do dedo,
  linhas de compasso e guias de Dó/Fá.
- **Dois manuais** (superior e inferior) e **pedaleira**, cada um acendendo só
  as teclas que lhe cabem.
- **Modos**: só ouvir (o app toca tudo), modo espera (as notas esperam o aluno —
  acordes exigem todas as notas) e no andamento (precisão e estrelas).
- **Trecho** por linha do hinário, com repetição sem parar.
- **Entradas**: teclado na tela (multitoque), **MIDI** (web — Chrome/Edge) e
  **microfone** (Android/iOS/web) com detecção de altura YIN em TypeScript puro.
- **Som** de piano e órgão sintetizado (sem arquivos de áudio), metrônomo.

Fontes incluídas em `assets/fonts/`: OpenDyslexic (com a altura ajustada para
os acentos do português) e DejaVu Sans (substituta da Verdana no Android). A
serifada é a Source Serif 4 (`@expo-google-fonts/source-serif-4`); a fonte
serifada do Claude não é livre, então usamos a mais parecida.

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

## Publicar como site

O app também roda como site (uma página só, sem servidor próprio: os hinos
vêm junto e os ajustes ficam no navegador).

```bash
npm run build:web    # gera a pasta dist/
```

- **Vercel**: importe o repositório do GitHub; o `vercel.json` já diz como
  gerar o site e manda qualquer endereço (ex.: `/tocar/hino-005`) para o app.
- **Netlify / Cloudflare Pages**: comando `npm run build:web`, pasta `dist`;
  o arquivo `public/_redirects` faz o mesmo redirecionamento.
- **Domínio próprio**: registre (ex.: registro.br para `.com.br`/`.org.br`) e
  aponte o DNS para o serviço escolhido, nas configurações de domínio dele.

## Arquitetura

```
src/
  app/                 Telas (Expo Router)
    index.tsx          Entrada: busca, Hinos/Coros e roda de números
    tocar/[songId].tsx Tocar o hino (painel de ajustes ao pausar)
  content/             Conteúdo como dados puros
    types.ts           Song, notas, vozes, trechos
    hinario/           480 hinos + 6 coros (JSON gerado pelo importador)
    hymnal.ts          Catálogo e carregamento dos hinos
    organ.ts           Arranjo da organista (mãos + pedaleira)
    notation.ts        Notação de texto (usada nos testes)
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
  components/          Teclado, pedaleira, notas caindo, partitura (HymnScore)
  music/spelling.ts    Grafia das notas (armadura, ♯ ♭ ♮ por compasso)
  features/player/     Tela de tocar, linha do tempo e o painel de ajustes
  features/settings/   Aparência (fonte e cores), também na tela inicial
  theme/               Paletas (preto e branco ou cores escolhidas) e fontes
  store/               Preferências (persistidas)
```

Leia também:

- [`docs/CONTEUDO.md`](docs/CONTEUDO.md) — como importar e cadastrar hinos.
- [`docs/PLANO_MOR.md`](docs/PLANO_MOR.md) — estudo do MOR (a trilha de lições foi retirada do app).
