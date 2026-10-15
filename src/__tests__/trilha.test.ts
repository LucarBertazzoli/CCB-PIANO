import { describe, expect, it } from '@jest/globals';

import { getLesson, lessonSong, nextLesson, TRILHA } from '@/content/trilha';

const KEY_OF: Record<string, number> = { Dó: 0, Fá: -1, Sol: 1, 'Si♭': -2, Ré: 2, 'Mi♭': -3, 'Lá♭': -4, 'Ré♭': -5 };

describe('trilha de aprendizagem', () => {
  const lessons = TRILHA.flatMap((v) => v.units.flatMap((u) => u.lessons.map((l) => ({ l, u }))));

  it('segue a ordem do MOR (volumes e unidades crescentes)', () => {
    for (const v of TRILHA) {
      const nums = v.units.map((u) => u.number);
      expect([...nums].sort((a, b) => a - b)).toEqual(nums);
    }
  });

  it('toda lição disponível abre uma música com o nome da lição', () => {
    const available = lessons.filter(({ l }) => l.available);
    expect(available.length).toBeGreaterThan(100);
    for (const { l, u } of available) {
      const song = lessonSong(l.id)!;
      expect(song).toBeDefined();
      expect(song.title).toBe(`Unidade ${u.number} · ${l.title}`);
      expect(song.notes.length).toBeGreaterThan(0);
      expect(getLesson(l.id)?.unit.id).toBe(u.id);
    }
  });

  it('“Estudo dos hinos em X Maior” só tem hinos dessa tonalidade', () => {
    for (const v of TRILHA) {
      for (const u of v.units) {
        const m = /hinos em (\S+) Maior/.exec(u.title);
        if (!m) continue;
        for (const l of u.lessons.filter((x) => x.kind === 'hino')) {
          expect([l.hymn, lessonSong(l.id)!.keySignature]).toEqual([l.hymn, KEY_OF[m[1]]]);
        }
      }
    }
  });

  it('escalas maiores sobem e descem uma oitava com dedilhado', () => {
    const sol = lessons.find(({ l }) => l.title === 'Escala de Sol Maior')!.l;
    const song = lessonSong(sol.id)!;
    const right = song.notes.filter((n) => n.hand === 'right').map((n) => n.midi);
    expect(right).toEqual([67, 69, 71, 72, 74, 76, 78, 79, 78, 76, 74, 72, 71, 69, 67]);
    expect(song.keySignature).toBe(1);
    expect(song.notes.every((n) => n.finger)).toBe(true);
  });

  it('“próxima lição” pula as que ainda estão em preparação', () => {
    const first = lessons.find(({ l }) => l.available)!.l;
    const next = nextLesson(first.id)!;
    expect(next.available).toBe(true);
  });
});
