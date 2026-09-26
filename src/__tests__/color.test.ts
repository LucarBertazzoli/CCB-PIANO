import { describe, expect, it } from '@jest/globals';

import { DEFAULT_COLORS } from '@/store/settings';
import { buildPalette, mono } from '@/theme';
import { inkOnPaper, luminance, mix, normalizeHex, readableOn } from '@/theme/color';

describe('cores', () => {
  it('normaliza códigos digitados', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
    expect(normalizeHex('ff5a1f')).toBe('#FF5A1F');
    expect(normalizeHex(' #00ff00 ')).toBe('#00FF00');
    expect(normalizeHex('#12')).toBeNull();
    expect(normalizeHex('azul')).toBeNull();
  });

  it('mistura e mede luminância', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(luminance('#FFFFFF')).toBeCloseTo(1);
    expect(luminance('#000000')).toBeCloseTo(0);
  });

  it('escolhe texto legível sobre qualquer fundo', () => {
    expect(readableOn('#FFFFFF')).toBe('#000000');
    expect(readableOn('#000000')).toBe('#FFFFFF');
    expect(readableOn('#FDD835')).toBe('#000000');
    expect(readableOn('#3949AB')).toBe('#FFFFFF');
  });

  it('escurece cores claras para escrever sobre o papel', () => {
    expect(luminance(inkOnPaper('#FDD835'))).toBeLessThan(luminance('#FDD835'));
    expect(inkOnPaper('#1E3A8A')).toBe('#1E3A8A');
  });

  it('monta a paleta com as cores escolhidas', () => {
    const p = buildPalette({ ...DEFAULT_COLORS, right: '#E53935', background: '#0B1220', paper: '#F6F0E1' });
    expect(p.mode).toBe('color');
    expect(p.keyRight[0]).toBe('#E53935');
    expect(p.noteRight).toBe('#E53935');
    expect(p.bg).toBe('#0B1220');
    expect(p.paper).toBe('#F6F0E1');
    // O modo preto e branco não muda.
    expect(mono.primary).toBe('#FFFFFF');
  });
});
