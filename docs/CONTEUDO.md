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

## 2. Lições

Uma `Lesson` é uma lista de passos:

| Passo | O que faz |
| --- | --- |
| `intro` | Texto explicativo, com teclas destacadas |
| `video` / `material` | Abre vídeo ou PDF oficial (YouTube / Drive) |
| `quiz` | Perguntas de múltipla escolha com explicação |
| `find-key` | Mostra a nota (nome ou pauta) e o aluno toca no teclado |
| `watch` | Ouvir (demonstração com notas caindo) |
| `practice` | Aprender — as notas esperam o aluno |
| `play` | Tocar no andamento; `minStars` exige estrelas para avançar |

Lições ficam em `src/content/courses/`. O MOR está em
`src/content/courses/mor.ts`: para ativar a parte interativa de uma unidade,
passe os passos no 5º argumento de `morUnit(...)`.

## 3. Direitos autorais

Hinos, estudos e materiais do MOR pertencem à Congregação Cristã no Brasil.
Transcreva e publique partituras no app **somente com autorização**. Enquanto
isso, o app abre os materiais pelos links oficiais.
