import { pitchClass } from './theory';

/**
 * Grafia das notas na partitura conforme a armadura de clave:
 * escolhe entre sustenido e bemol, e decide quando mostrar ♯, ♭ ou ♮,
 * lembrando os acidentes até o fim do compasso (regra da escrita musical).
 */

// Letras: 0=Dó 1=Ré 2=Mi 3=Fá 4=Sol 5=Lá 6=Si
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // Fá Dó Sol Ré Lá Mi Si
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // Si Mi Lá Ré Sol Dó Fá

export interface Spelled {
  /** Passo diatônico (oitava * 7 + letra). */
  step: number;
  /** Sinal a desenhar antes da nota (ou null). */
  sign: '♯' | '♭' | '♮' | null;
}

/** Alteração de cada letra definida pela armadura (+1, -1 ou 0). */
export function keyAlterations(fifths: number): number[] {
  const alt = [0, 0, 0, 0, 0, 0, 0];
  if (fifths > 0) for (const l of SHARP_ORDER.slice(0, fifths)) alt[l] = 1;
  if (fifths < 0) for (const l of FLAT_ORDER.slice(0, -fifths)) alt[l] = -1;
  return alt;
}

/** Escolhe letra e alteração para uma altura, dada a armadura. */
export function letterFor(midi: number, fifths: number): { letter: number; alter: number; octave: number } {
  const pc = pitchClass(midi);
  const keyAlt = keyAlterations(fifths);
  // 1) Nota da própria tonalidade?
  for (let l = 0; l < 7; l++) {
    if ((LETTER_PC[l] + keyAlt[l] + 12) % 12 === pc) {
      return { letter: l, alter: keyAlt[l], octave: octaveOfLetter(midi, l, keyAlt[l]) };
    }
  }
  // 2) Nota natural (branca)?
  const natural = LETTER_PC.indexOf(pc);
  if (natural >= 0) return { letter: natural, alter: 0, octave: octaveOfLetter(midi, natural, 0) };
  // 3) Tecla preta fora da tonalidade: sustenido em tons com ♯, bemol em tons com ♭.
  if (fifths < 0) {
    const l = LETTER_PC.indexOf((pc + 1) % 12);
    return { letter: l, alter: -1, octave: octaveOfLetter(midi, l, -1) };
  }
  const l = LETTER_PC.indexOf((pc + 11) % 12);
  return { letter: l, alter: 1, octave: octaveOfLetter(midi, l, 1) };
}

function octaveOfLetter(midi: number, letter: number, alter: number): number {
  // Ex.: Dó♭ pertence à oitava de cima; Si♯ à de baixo.
  return Math.round((midi - LETTER_PC[letter] - alter) / 12) - 1;
}

/**
 * Cria um “grafador” para uma partitura. Chame `spell(midi, compasso)` em
 * ordem de tempo; os acidentes valem até o fim do compasso.
 */
export function createSpeller(fifths: number) {
  const keyAlt = keyAlterations(fifths);
  let currentMeasure = '';
  let memory = new Map<number, number>(); // passo -> alteração em vigor
  return (midi: number, measureKey: string): Spelled => {
    if (measureKey !== currentMeasure) {
      currentMeasure = measureKey;
      memory = new Map();
    }
    const { letter, alter, octave } = letterFor(midi, fifths);
    const step = octave * 7 + letter;
    const inForce = memory.has(step) ? memory.get(step)! : keyAlt[letter];
    let sign: Spelled['sign'] = null;
    if (alter !== inForce) sign = alter === 1 ? '♯' : alter === -1 ? '♭' : '♮';
    memory.set(step, alter);
    return { step, sign };
  };
}

/** Versão sem memória de compasso (útil para notas isoladas). */
export function spellNote(midi: number, fifths: number): Spelled {
  return createSpeller(fifths)(midi, '');
}

