# Como cadastrar conteúdo

Todo o conteúdo é **dado** (TypeScript em `src/content/`). As telas não mudam
quando entram hinos ou lições novas. No futuro, os mesmos objetos podem vir de
uma API/JSON.

## 1. Músicas (hinos, estudos, exercícios)

Uma música é um `Song` (`src/content/types.ts`). A forma mais rápida de escrever
as notas é a **notação de texto** (`src/content/notation.ts`):

```ts
import { twoHands } from '../notation';

{
  id: 'hino-158',
  kind: 'hymn',
  hymnNumber: 158,
  title: 'Título do hino',
  tempo: 76,                 // semínimas por minuto
  timeSignature: [4, 4],
  keySignature: -1,          // -1 = Fá maior (1 bemol); 1 = Sol maior…
  difficulty: 2,
  instruments: ['organ', 'piano'],
  sections: [                // trechos para praticar em partes (em batidas)
    { id: 'l1', label: '1ª linha', startBeat: 0, endBeat: 16 },
  ],
  notes: twoHands(
    // mão direita (soprano + contralto)
    '[A4 F4]/h:4,2 [G4 E4]/q [F4 C4] | [C5 F4]/w',
    // mão esquerda (tenor + baixo)
    '[F3 A3]/h [C3 C4]/q [F3 A3] | [F2 A3]/w',
  ),
}
```

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
