import { describe, expect, it } from '@jest/globals';

import { createSpeller, letterFor } from '@/music/spelling';

describe('grafia das notas', () => {
  it('usa a armadura: Fá♯ em Sol maior não leva sinal', () => {
    const spell = createSpeller(1);
    expect(spell(66, '0')).toEqual({ step: 31, sign: null });
  });

  it('Fá natural em Sol maior leva bequadro, e vale até o fim do compasso', () => {
    const spell = createSpeller(1);
    expect(spell(65, '0').sign).toBe('♮');
    expect(spell(65, '0').sign).toBeNull();
    expect(spell(65, '1').sign).toBe('♮');
  });

  it('Si♭ em Fá maior; Lá♭ fora da tonalidade leva bemol', () => {
    expect(letterFor(70, -1)).toEqual({ letter: 6, alter: -1, octave: 4 });
    const spell = createSpeller(-1);
    expect(spell(70, '0').sign).toBeNull();
    expect(spell(68, '0').sign).toBe('♭');
  });

  it('em Dó maior, teclas pretas viram sustenidos e a memória do compasso funciona', () => {
    const spell = createSpeller(0);
    expect(spell(61, '0')).toEqual({ step: 28, sign: '♯' });
    expect(spell(61, '0').sign).toBeNull();
    expect(spell(60, '0').sign).toBe('♮');
  });
});
