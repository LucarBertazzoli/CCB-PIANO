/** Pequenas contas de cor (hex #RRGGBB), sem dependências. */

type RGB = [number, number, number];

export function isHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** Aceita "#abc", "abc", "#aabbcc" ou "aabbcc"; devolve "#AABBCC" ou null. */
export function normalizeHex(value: string): string | null {
  let v = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.replace(/(.)/g, '$1$1');
  return /^[0-9a-f]{6}$/i.test(v) ? `#${v.toUpperCase()}` : null;
}

function rgb(hex: string): RGB {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b]
    .map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/** Mistura `a` com `b` (t = 0 → a, t = 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Luminância relativa (WCAG), de 0 (preto) a 1 (branco). */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Preto ou branco, o que tiver mais contraste sobre `bg`. */
export function readableOn(bg: string): '#000000' | '#FFFFFF' {
  const l = luminance(bg);
  return (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? '#000000' : '#FFFFFF';
}

/** Escurece cores claras para ficarem legíveis sobre papel branco. */
export function inkOnPaper(hex: string): string {
  const l = luminance(hex);
  return l > 0.35 ? mix(hex, '#000000', Math.min(0.6, (l - 0.2) * 0.9)) : hex;
}
