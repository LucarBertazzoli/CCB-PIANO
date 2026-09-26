# Como cadastrar conteúdo

Todo o conteúdo é **dado** (TypeScript em `src/content/`). As telas não mudam
quando entram hinos ou lições novas. No futuro, os mesmos objetos podem vir de
uma API/JSON.

## 1. Hinário (480 hinos + 6 coros)

Os hinos ficam em `src/content/hinario/` (um arquivo `.json` por hino) e são
gerados pelo importador a partir de partituras digitais do MuseScore:

```bash
python3 scripts/importar-hinario.py <pasta-com-arquivos-.mscx> src/content/hinario
```

Fonte atual: partituras digitais a 4 vozes do Hinário nº 5
(<https://github.com/eneiasramos/ccb-hinario-5-do>, pasta `do/musescore/xml`).
O importador:

- separa soprano, contralto, tenor e baixo (pela altura em cada pauta);
- lê pontos de aumento, ligaduras, quiálteras, pausas e anacruses;
- mantém os compassos e as **linhas do hinário** (viram os trechos “1ª linha”…);
- resolve os ritornelos de estrofes tocando o hino uma vez, pela casa final;
- guarda título, autor, tonalidade, compasso e metrônomo (♩, ♪, ♩. ou mínima);
- gera `registry.ts` (índice e carregamento sob demanda).

No órgão, o app monta o **arranjo da organista** (`src/content/organ.ts`):
mão direita soprano+contralto, mão esquerda tenor+baixo com notas repetidas
seguradas (legato) e pedaleira a partir do baixo. O teste
`src/__tests__/hymnal.test.ts` confere o hino 1 e o hino 5 com o hinário de
órgão impresso.

Para trocar a fonte (por exemplo, pelos arquivos oficiais da CCB), basta
exportá-los para `.mscx` do MuseScore e rodar o importador de novo.

## 1b. Músicas escritas à mão (exercícios e exemplos)

Para exercícios e peças curtas, a notação de texto continua disponível:

```ts
import { fourVoices } from '../notation';

...fourVoices({
  soprano: 'A4/h:4 G4/q:3 F4 | C5/w',
  alto:    'F4/h:2 E4/q:1 C4 | F4/w',
  tenor:   'C4/h D4/q A3 | A3/w',
  bass:    'F3/h C3/q F3 | F2/w',
})
```

A notação de cada voz:

| Símbolo | Significado |
| --- | --- |
| `C4`, `F#3`, `Bb2` | Nota (Dó central = `C4`) |
| `[C4 E4 G4]` | Acorde |
| `r` | Pausa |
| `/w /h /q /e /s` | Semibreve, mínima, semínima, colcheia, semicolcheia |
| `/q.` | Pontuada (×1,5) — ou um número de batidas: `/1.5` |
| `:3` ou `:1,3,5` | Dedilhado (um dedo por nota do acorde) |
| `\|` | Barra de compasso (só para leitura) |

Se a duração for omitida, repete a anterior. Use `parseVoice(texto, { hand, voice })`
e `mergeVoices(...)` para escrever as quatro vozes separadamente.

Registre o arquivo em `src/content/index.ts` (lista de `songs`). O teste
`src/__tests__/content.test.ts` verifica automaticamente se cada mão fecha
compassos completos e se as lições apontam para músicas existentes.

## 2. Lições e a trilha

A trilha fica em `src/content/courses/trilha.ts`, na ordem do MOR (Volume 1).
Cada **nível** (unidade) tem lições curtas; cada lição é uma lista de passos:

| Passo | O que o aluno faz |
| --- | --- |
| `intro` | Lê uma explicação curta, com pauta, teclado ou figuras ilustrando (`illustration`) |
| `listen` | Ouve sons tocados pelo app e responde (grave/agudo, subiu/desceu, curto/longo, forte/fraco, timbre, compasso, tom/semitom) |
| `quiz` | Responde perguntas de múltipla escolha, com ilustração opcional |
| `find-key` | Vê a nota (nome ou pauta) e toca a tecla certa (`anyOctave` aceita qualquer oitava) |
| `rhythm` | Lê as figuras na pauta e toca **qualquer tecla** no ritmo, com metrônomo |
| `watch` | Ouve e vê a música (demonstração) |
| `practice` | Toca no modo espera (as notas esperam o aluno) |
| `play` | Toca no andamento; `minStars` exige estrelas para avançar |

`view: 'sheet'` mostra a partitura em vez das notas caindo (leitura).

Exemplo de rodada de percepção:

```ts
{
  type: 'listen',
  title: 'Grave ou agudo?',
  rounds: [
    { question: 'O segundo som foi…', sounds: [{ midi: 60, beats: 1 }, { midi: 72, beats: 1 }],
      options: ['Grave', 'Agudo'], answer: 1 },
  ],
}
```

Exercícios de ritmo são músicas com a tag `ritmo` em `src/content/songs/estudos.ts`
(todas as notas no Si da 3ª linha: `B4/q B4 B4/h …`).

Padrão de oitavas da CCB: **Dó central = Dó3** (no código, `C4` / MIDI 60).

## 3. Direitos autorais

Hinos, estudos e materiais do MOR pertencem à Congregação Cristã no Brasil.
Transcreva e publique partituras no app **somente com autorização**. Enquanto
isso, o app abre os materiais pelos links oficiais.
