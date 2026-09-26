import { describe, expect, it } from '@jest/globals';

import { fitRange, keyboardLayout } from '@/components/keyboard-layout';
import { getSong } from '@/content';
import { HYMN_GROUPS, hymnCatalog } from '@/content/hymnal';

describe('hinário', () => {
  it('todos os hinos e coros carregam com as 4 vozes e compassos coerentes', () => {
    const catalog = hymnCatalog();
    expect(catalog).toHaveLength(486);
    for (const entry of catalog) {
      const song = getSong(entry.songId)!;
      expect(song).toBeDefined();
      expect(song.title).toBeTruthy();
      for (const voice of ['soprano', 'alto', 'tenor', 'bass'] as const) {
        const notes = song.notes.filter((n) => n.voice === voice);
        expect(notes.length).toBeGreaterThan(0);
        // Nenhuma nota passa do fim do hino.
        expect(Math.max(...notes.map((n) => n.start + n.duration))).toBeLessThanOrEqual(song.endBeat! + 1e-6);
      }
      expect(song.measures![0]).toBe(0);
      expect(song.sections!.length).toBeGreaterThan(0);
    }
  });
});

describe('layout do teclado', () => {
  it('ajusta a extensão cobrindo as notas, com o mínimo de teclas', () => {
    const [low, high] = fitRange(60, 67, 15);
    expect(low).toBeLessThanOrEqual(60);
    expect(high).toBeGreaterThanOrEqual(67);
    const layout = keyboardLayout(low, high, 900);
    expect(layout.keys.filter((k) => !k.black)).toHaveLength(15);
    const c = layout.byMidi.get(60)!;
    const cs = layout.byMidi.get(61)!;
    expect(cs.x).toBeGreaterThan(c.x);
    expect(cs.x).toBeLessThan(c.x + c.width);
  });
});

describe('grupos da tela inicial', () => {
  it('tem as quantidades do hinário', () => {
    const cat = hymnCatalog();
    const count = Object.fromEntries(HYMN_GROUPS.map((g) => [g.id, cat.filter(g.includes).length]));
    expect(count).toEqual({ hinos: 480, jovens: 50, ceia: 17, funeral: 7, coros: 6 });
  });
});
