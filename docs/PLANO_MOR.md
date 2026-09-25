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

A trilha (`src/content/courses/trilha.ts`) converte o **Volume 1** em 23 níveis
jogáveis, sem vídeos nem PDFs, focados no teclado:

| Nível | Unidade do MOR | Atividades no app |
| --- | --- | --- |
| 1 | 1 Apresentação do instrumento | teclas brancas/pretas, grave × agudo, quiz |
| 2 | 2 O som e suas propriedades | ouvir: altura, duração, intensidade, timbre; quiz |
| 3 | 3 Postura e posição | explicações + “certo ou errado” |
| 4 | 4 Notas musicais | subiu/desceu, sequência das notas, achar o Dó, primeira melodia |
| 5 | 5 Dedilhado e articulação | números dos dedos, toque ligado, cinco dedos |
| 6 | 6 Pauta | linha × espaço, numeração, linhas suplementares |
| 7 | 7 Claves | ler e tocar na clave de Sol, de Fá e o Dó3 nas duas |
| 8 | 8 Figuras | semibreve/mínima/semínima, proporções, ouvir durações |
| 9 | 9 Ritmo e metrônomo | pulsação e leitura rítmica tocando no tempo |
| 10 | 10 Registração | timbres, registros, efeitos |
| 11 | 11 Estudos 1–10 | estudos de leitura: 5 notas a partir do Dó3, mãos intercaladas |
| 12 | 12 Compassos e pausas | ouvir binário/ternário/quaternário, fórmula, pausas, ritmo |
| 13 | 13 Estudos 11–15 | mão esquerda no Dó2, movimento paralelo e contrário |
| 14 | 14 Ligadura de valor | ouvir ligado × repetido, estudo |
| 15 | 15 Ponto de aumento | mínima pontuada, 3/4 |
| 16 | 16 Colcheia | proporções, ritmo, exercício de articulação |
| 17 | 17 Recursos de dedilhado | A, C, M, S, P, Dt; passagem do polegar na escala |
| 18 | 18–19 Respiração e repetição | quiz |
| 19 | 21 Tom, semitom e alterações | ouvir tom × semitom, sustenidos e bemóis |
| 20 | 22 Escalas e acordes | escala de Dó, acordes Dó/Fá/Sol, peça |
| 21 | 23 Sol maior | armadura, posição e escala |
| 22 | 24 Fá maior | armadura, posição e escala |
| 23 | 26 Hinos | primeiro hino por partes |

Os **Estudos** e exercícios da trilha são composições próprias do app que seguem a
mesma progressão do método. Os textos são próprios, escritos a partir dos
objetivos de cada unidade (o material oficial é de uso restrito e protegido).

## 4. Próximas etapas

1. **Estudos e hinos oficiais** — com autorização, transcrever os Estudos 1–40,
   Exercícios e os Hinos 158, 131 e 468 (formato em `docs/CONTEUDO.md`) e
   trocar os estudos próprios pelos oficiais nos níveis correspondentes.
2. **Importador MusicXML/MIDI → `Song`** para acelerar a transcrição.
3. **Pedaleira** (Unidade 25) — pista própria e desenho da pedaleira.
4. **Volume 2** — tonalidades, contratempo, síncopa, compasso composto,
   quiálteras e estudo dos hinos por tonalidade, seguindo o mesmo modelo.
5. **Quatro vozes** — praticar soprano, contralto, tenor e baixo separadamente.
6. **Ditado rítmico e melódico** — o app toca e o aluno reproduz no teclado.
