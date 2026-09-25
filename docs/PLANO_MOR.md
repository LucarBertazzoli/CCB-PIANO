# Plano de integração do MOR

Fonte: <https://congregacaocristanobrasil.org.br/musica/mor> — *MOR, Método de
Estudos para Órgão Eletrônico*.

## 1. O que o MOR oferece (levantamento)

| Volume | Situação | Unidades | Conteúdo por volume |
| --- | --- | --- | --- |
| Apresentação | publicado | — | vídeo de apresentação + Manual Digital para Instrutoras |
| 1 | publicado | 26 + conclusão | Treinamento, Vídeos explicativos, Áudio dos estudos, Planos de aula (PDF por unidade), Videoaulas, Atividades interativas, Atividades avaliativas (cadernos da aluna/instrutora, infantil) |
| 2 | publicado | 35 | mesmos 7 tipos de material |
| 3 | em desenvolvimento | — | links já existem, pastas vazias |
| 4 | em desenvolvimento | — | links já existem, pastas vazias |

Há também uma **errata** (PDF) publicada na página.

**Volume 1** vai do zero (o órgão, o som, postura, notas, pauta, claves,
figuras, ritmo, registração) aos Estudos 1–40, exercícios, escalas de Dó/Sol/Fá,
pedaleira e os **Hinos 158, 131 e 468**.
**Volume 2** trabalha tonalidades (Dó, Fá, Sol, Si♭, Ré, Mi♭, Lá♭, Ré♭),
ritmos (contratempo, síncopa, compasso composto, quiálteras), dinâmica,
pedaleira, inversão de vozes e **estudo dos hinos por tonalidade**, terminando
com introduções e meia-hora.

## 2. Como cada material vira interação no app

| Material do MOR | No app |
| --- | --- |
| Plano de aula (PDF) | Passo `material` no início da unidade ✅ · depois: conteúdo resumido em telas `intro` |
| Videoaulas / Vídeos explicativos | Passo `video` ✅ · depois: vídeo embutido e vínculo por unidade (id do vídeo) |
| Teoria (notas, pauta, claves, figuras, compassos, tom/semitom, escalas, tonalidades) | `quiz` ✅ e `find-key` ✅ (ler nota na pauta e tocar) · depois: ditado rítmico, identificar tonalidade pela armadura |
| Estudos e Exercícios (partituras) | Transcrição para `Song` → `watch` + `practice` (espera) + `play` (estrelas), por mão e por trecho |
| Áudio dos estudos | Referência de andamento e demonstração (`watch`) |
| Hinos (158, 131, 468 no Vol. 1; estudos de hinos no Vol. 2) | `Song` com 4 vozes → praticar soprano, contralto, tenor, baixo; mãos separadas; hino completo |
| Pedaleira | Nova “mão” `pedal` (3ª pista de notas, cor própria, teclado de pedaleira desenhado) |
| Registração | Seleção de timbre de órgão no player; depois: sugestões de registração por hino |
| Atividades interativas / avaliativas | Quizzes e “provas” de unidade com nota mínima para liberar a próxima |

## 3. O que já está no código

- Volumes 1–4 modelados em `src/content/courses/mor.ts`, com **todas as
  unidades** dos volumes 1 e 2 e os links oficiais de cada tipo de material.
- Unidades 1–11 e 22 do Volume 1 já têm passos interativos (quizzes, encontrar
  notas no teclado e na pauta, prática com notas caindo). As demais mostram o
  material oficial e o aviso “estudos interativos em preparação”.
- Volumes 3 e 4 aparecem como “em desenvolvimento”.

## 4. Próximas etapas

1. **Autorização e fonte de conteúdo** — alinhar com os responsáveis o uso das
   partituras (Estudos, Exercícios, Hinos) dentro do app.
2. **Importador MusicXML/MIDI → `Song`** — para transcrever os estudos rápido
   (MuseScore exporta MusicXML), preservando dedilhado e vozes.
3. **Transcrever Volume 1** unidade a unidade (Estudos 1–40, Exercícios 2–22,
   Hinos 158/131/468) e ligar em `morUnit(...)`.
4. **Pedaleira** — tipo `pedal`, pista própria, desenho da pedaleira de 13/32
   notas, exercícios de pedaleira do Vol. 2.
5. **Quatro vozes** — praticar voz a voz (soprano/contralto/tenor/baixo), como
   é feito nos ensaios.
6. **Vídeo embutido** e marcação do trecho da videoaula de cada unidade.
7. **Modo instrutora** — acompanhar alunas, liberar unidades, relatórios (usando
   as atividades avaliativas).
8. **MIDI nativo** (USB/Bluetooth no Android/iOS) e detecção **polifônica** pelo
   microfone (acordes).
9. **Hinário completo** — catálogo com busca por número, tonalidade e
   dificuldade.
