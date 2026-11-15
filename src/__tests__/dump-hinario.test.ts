import { it } from '@jest/globals';
import { writeFileSync } from 'fs';

import { getSong } from '@/content';
import { hymnIndex } from '@/content/hymnal';

/**
 * Exporta as 4 vozes de todos os hinos (para scripts/orgao):
 *   DUMP=/caminho/raw.json npx jest dump-hinario
 */
(process.env.DUMP ? it : it.skip)('exporta o hinário', () => {
  const out: Record<string, unknown> = {};
  for (const h of hymnIndex) {
    const id = `${h.kind}-${String(h.n).padStart(3, '0')}`;
    const s = getSong(id)!;
    out[id] = { key: s.keySignature, measures: s.measures, lines: s.lines, end: s.endBeat, notes: s.notes.map((n) => [n.midi, n.start, n.duration, n.voice, n.hand]) };
  }
  writeFileSync(process.env.DUMP!, JSON.stringify(out));
});
