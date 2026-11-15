# Arranjo de órgão a partir do hinário impresso

O app usa, em cada hino aprovado, o arranjo exatamente como está no Hinário
nº 5 para órgão (PDF vetorial): quais notas a organista ataca e quais segura,
ligaduras, respirações e a oitava de cada mão e da pedaleira. O ritmo e os
acidentes vêm das 4 vozes já importadas (`scripts/importar-hinario.py`).

Como funciona:

1. `extract.py` lê o PDF vetorial: pautas (3 por sistema: mão direita, mão
   esquerda, pedaleira), cabeças de nota (cheias, vazadas, semibreves),
   ligaduras, barras de compasso e o número de cada hino.
2. `build.py` casa cada coluna impressa com um ataque das 4 vozes (mesma nota
   pela armadura, mesma oitava e mesma posição no compasso) e grava o campo
   `organ` em `src/content/hinario/*.json`.
3. `gate.py` aprova só os hinos bem alinhados (quase todas as notas das vozes
   soando e sem deriva). Os outros continuam com o arranjo automático
   (`src/content/organ.ts`).

```bash
python3 -m venv .venv && .venv/bin/pip install pymupdf
DUMP=/tmp/raw.json npx jest dump-hinario
cp -r src/content/hinario /tmp/hin && .venv/bin/python scripts/orgao/build.py orgao.pdf /tmp/raw.json /tmp/hin
.venv/bin/python scripts/orgao/gate.py /tmp/raw.json /tmp/hin /tmp/aprovados.json
# copie o campo "organ" dos aprovados de /tmp/hin para src/content/hinario
```

Os hinos 273 e 274 ficam de fora: na cópia do PDF usada as páginas estão
cortadas à direita.
