#!/usr/bin/env python3
"""
Importa o hinário a partir de arquivos do MuseScore 2 (.mscx) e gera os
arquivos de dados usados pelo app (src/content/hinario/*.json).

Uso:
    python3 scripts/importar-hinario.py <pasta-com-mscx> [saida]

Cada arquivo tem duas pautas: "Parte I e II" (soprano e contralto) e
"Parte III e IV" (tenor e baixo). O script:
  * lê notas, pausas, pontos de aumento, ligaduras e quiálteras;
  * separa as 4 vozes pela altura (a mais aguda de cada pauta é a voz de cima);
  * resolve ritornelos de estrofes tocando o hino uma vez, pela casa final;
  * guarda compassos (inclusive anacruse), linhas (quebras de sistema),
    tonalidade, fórmula de compasso, andamento, título e autor.

Formato de saída (compacto, tempos em "ticks": 480 = uma semínima):
  { n, title, composer, key, time: [n, d], tempo: [min, max],
    measures: [inícios...], end, lines: [inícios...],
    notes: [[midi, início, duração, voz(0=S 1=A 2=T 3=B)], ...],
    rests: [[início, duração, pauta(0|1)], ...] }
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from fractions import Fraction

TPQ = 480
DURATIONS = {'whole': 1920, 'half': 960, 'quarter': 480, 'eighth': 240, '16th': 120, '32nd': 60, '64th': 30}


def text(el, path, default=None):
    found = el.find(path)
    return found.text if found is not None and found.text is not None else default


def parse_staff(staff):
    """Lê uma pauta: devolve compassos com notas e pausas (tempos absolutos)."""
    measures = []
    tick = 0
    time_sig = (4, 4)
    tuplets = {}
    ties = {}  # id -> nota aberta
    for m in staff.findall('Measure'):
        for ts in m.iter('TimeSig'):
            time_sig = (int(text(ts, 'sigN', 4)), int(text(ts, 'sigD', 4)))
        full = TPQ * 4 * time_sig[0] // time_sig[1]
        length = full
        if m.get('len'):
            length = int(Fraction(m.get('len')) * TPQ * 4)
        info = {
            'start': tick,
            'len': length,
            'notes': [],
            'rests': [],
            'lineBreak': any(text(lb, 'subtype') == 'line' for lb in m.findall('LayoutBreak')),
            'voltas': [],
            'voltaEnds': [],
            'time': time_sig,
            'key': None,
            'tempo': None,
        }
        ks = m.find('KeySig')
        if ks is not None:
            info['key'] = int(text(ks, 'accidental', 0))
        tp = m.find('Tempo')
        if tp is not None and tp.find('text') is not None:
            t_el = tp.find('text')
            syms = [x.text or '' for x in t_el.iter('sym')]
            plain = (t_el.text or '') + ''.join((x.tail or '') for x in t_el.iter('sym'))
            info['tempo'] = (float(text(tp, 'tempo', 1)), plain, syms)
        cur = tick
        seen_chord = False
        for el in m:
            tag = el.tag
            if tag == 'tick':
                cur = int(el.text)
            elif tag == 'Tuplet':
                tuplets[el.get('id')] = (int(text(el, 'normalNotes', 1)), int(text(el, 'actualNotes', 1)))
            elif tag == 'Volta':
                info['voltas'].append((el.get('id'), text(el, 'endings', ''), seen_chord))
            elif tag == 'endSpanner':
                info['voltaEnds'].append((el.get('id'), seen_chord))
            elif tag in ('Chord', 'Rest'):
                seen_chord = True
                dt = text(el, 'durationType', 'quarter')
                if dt == 'measure':
                    dur = length
                else:
                    dur = DURATIONS[dt]
                    dots = int(text(el, 'dots', 0))
                    dur = dur * (2 - Fraction(1, 2 ** dots))
                    tref = text(el, 'Tuplet')
                    if tref is not None and tref in tuplets:
                        normal, actual = tuplets[tref]
                        dur = dur * Fraction(normal, actual)
                    dur = int(dur)
                track = int(text(el, 'track', 0)) % 4
                if tag == 'Rest':
                    if text(el, 'visible', '1') != '0':
                        info['rests'].append({'start': cur, 'dur': dur, 'track': track})
                else:
                    if el.find('acciaccatura') is not None or el.find('appoggiatura') is not None:
                        continue
                    for note in el.findall('Note'):
                        pitch = int(text(note, 'pitch'))
                        end = note.find('endSpanner')
                        tie = note.find('Tie')
                        if end is not None and end.get('id') in ties:
                            opened = ties.pop(end.get('id'))
                            opened['dur'] = cur + dur - opened['start']
                            if tie is not None:
                                ties[tie.get('id')] = opened
                            continue
                        n = {'pitch': pitch, 'start': cur, 'dur': dur, 'track': track}
                        info['notes'].append(n)
                        if tie is not None:
                            ties[tie.get('id')] = n
                cur += dur
        measures.append(info)
        tick += length
    return measures


def assign_voices(notes, upper, lower):
    """Separa duas vozes de uma pauta pela altura em cada momento."""
    out = []
    # Remove duplicatas exatas (uníssono escrito nas duas camadas) e marca uníssono.
    by_key = {}
    for n in notes:
        k = (n['start'], n['pitch'])
        if k in by_key:
            by_key[k]['unison'] = True
            by_key[k]['dur'] = max(by_key[k]['dur'], n['dur'])
        else:
            by_key[k] = dict(n)
    uniq = sorted(by_key.values(), key=lambda n: (n['start'], n['pitch']))
    for n in uniq:
        others = [o for o in uniq if o is not n and o['start'] <= n['start'] < o['start'] + o['dur']]
        if n.get('unison'):
            out.append((n, upper))
            out.append((n, lower))
        elif not others:
            # Nota sozinha na pauta: as duas vozes cantam em uníssono.
            out.append((n, upper))
            out.append((n, lower))
        elif n['pitch'] >= max(o['pitch'] for o in others):
            out.append((n, upper))
        else:
            out.append((n, lower))
    return out


def silent_gaps(notes, start, end):
    """Intervalos sem nenhuma nota soando na pauta (para desenhar pausas)."""
    gaps = []
    cur = start
    for n in sorted(notes, key=lambda n: n['start']):
        if n['start'] > cur:
            gaps.append((cur, n['start']))
        cur = max(cur, n['start'] + n['dur'])
    if cur < end:
        gaps.append((cur, end))
    return gaps


def split_rest(start, dur):
    """Quebra um silêncio em figuras de pausa usuais."""
    out = []
    for value in (1920, 960, 480, 240, 120):
        while dur >= value:
            out.append((start, value))
            start += value
            dur -= value
    return out


def convert(path, number):
    root = ET.parse(path).getroot()
    score = root.find('Score')
    staves = score.findall('Staff')
    if len(staves) < 2:
        raise ValueError('esperadas 2 pautas')
    top = parse_staff(staves[0])
    bottom = parse_staff(staves[1])

    # Título e autor (caixa de texto do topo)
    title, composer = None, None
    for t in staves[0].iter('Text'):
        style = text(t, 'style')
        value = ''.join(t.find('text').itertext()).strip() if t.find('text') is not None else ''
        if style == 'Title' and not title:
            title = value
        elif style == 'Composer' and not composer:
            composer = value
    title = re.sub(r'\s*\.{2,}$|…$', '', title or '').strip()

    # Casas de ritornelo: toca o hino uma vez, pela última casa.
    voltas = {}
    open_voltas = {}
    for i, m in enumerate(top):
        for vid, endings, _ in m['voltas']:
            open_voltas[vid] = i
            voltas[vid] = [i, None, endings]
        for vid, after_chord in m['voltaEnds']:
            if vid in open_voltas:
                start = open_voltas.pop(vid)
                voltas[vid][1] = i if after_chord else max(start, i - 1)
    for vid, start in open_voltas.items():
        voltas[vid][1] = len(top) - 1
    skip = set()
    if voltas:
        groups = sorted(voltas.values())
        for s, e, _ in groups[:-1]:
            skip.update(range(s, e + 1))

    # Nova linha do tempo sem as casas puladas
    order = [i for i in range(len(top)) if i not in skip]
    new_start = {}
    t = 0
    measures, lines = [], [0]
    for i in order:
        new_start[i] = t
        measures.append(t)
        t += top[i]['len']
        if top[i]['lineBreak']:
            lines.append(t)
    end = t
    if lines[-1] >= end:
        lines.pop()

    def shift(staff):
        out = []
        for i in order:
            m = staff[i]
            delta = new_start[i] - m['start']
            for n in m['notes']:
                out.append({**n, 'start': n['start'] + delta})
        return out

    notes = []
    for staff, (up, low) in ((top, (0, 1)), (bottom, (2, 3))):
        staff_notes = shift(staff)
        for n, voice in assign_voices(staff_notes, up, low):
            notes.append([n['pitch'], n['start'], n['dur'], voice])
    notes.sort(key=lambda n: (n[1], n[3]))

    # Uma voz que se separa de um uníssono: a nota compartilhada termina
    # quando a voz anda (a outra voz continua segurando).
    for voice in range(4):
        vs = sorted((n for n in notes if n[3] == voice), key=lambda n: n[1])
        for i, a in enumerate(vs):
            nxt = next((b for b in vs[i + 1:] if b[1] > a[1]), None)
            if nxt is not None and nxt[1] < a[1] + a[2]:
                a[2] = nxt[1] - a[1]

    rests = []
    for staff_index, staff in enumerate((top, bottom)):
        staff_notes = shift(staff)
        for i in order:
            s = new_start[i]
            e = s + staff[i]['len']
            inside = [n for n in staff_notes if s <= n['start'] < e or n['start'] < s < n['start'] + n['dur']]
            for gs, ge in silent_gaps(inside, s, e):
                for rs, rd in split_rest(gs, ge - gs):
                    rests.append([rs, rd, staff_index])

    key = next((m['key'] for m in top if m['key'] is not None), 0)
    time_sig = top[0]['time']
    tempo_info = next((m['tempo'] for m in top if m['tempo'] is not None), None)
    # Andamento: guardamos a indicação original (unidade + faixa) e a
    # conversão para semínimas por minuto, que é o que o app usa.
    tempo = [72, 72]
    tempo_unit = 'q'
    tempo_note = ''
    if tempo_info:
        _, plain, syms = tempo_info
        found = [int(x) for x in re.findall(r'\d+', plain)]
        sym = ' '.join(syms)
        if 'Half' in sym:
            tempo_unit, factor = 'h', 2
        elif '8th' in sym:
            tempo_unit, factor = 'e', 0.5
        elif 'AugmentationDot' in sym:
            tempo_unit, factor = 'q.', 1.5
        else:
            tempo_unit, factor = 'q', 1
        if found:
            tempo = [found[0], found[-1]]
        tempo_note = re.sub(r'^[\s(]*=?[\s\d-]*\)?\s*', '', plain.split(')', 1)[-1]).strip() if ')' in plain else ''
        tempo = [round(tempo[0] * factor), round(tempo[1] * factor), tempo[0], tempo[1]]

    return {
        'n': number,
        'title': title,
        'composer': composer or '',
        'key': key,
        'time': list(time_sig),
        'tempo': tempo[:2],
        'tempoMark': {'unit': tempo_unit, 'min': tempo[2] if len(tempo) > 2 else tempo[0], 'max': tempo[3] if len(tempo) > 3 else tempo[1], 'text': tempo_note},
        'measures': measures,
        'end': end,
        'lines': lines,
        'notes': notes,
        'rests': rests,
    }


def main():
    src = sys.argv[1]
    dest = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'hinario')
    os.makedirs(dest, exist_ok=True)
    index = []
    errors = []
    for name in sorted(os.listdir(src)):
        m = re.match(r'(hino|coro)-(\d+)\.mscx$', name)
        if not m:
            continue
        kind, number = m.group(1), int(m.group(2))
        try:
            data = convert(os.path.join(src, name), number)
        except Exception as exc:  # noqa: BLE001
            errors.append(f'{name}: {exc}')
            continue
        data['kind'] = kind
        file = f'{kind}-{number:03d}.json'
        with open(os.path.join(dest, file), 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
        index.append({'kind': kind, 'n': number, 'title': data['title'], 'file': file})
    index.sort(key=lambda e: (e['kind'] != 'hino', e['n']))
    # Registro TypeScript: índice + carregadores preguiçosos (um require por hino).
    lines = [
        '// Gerado por scripts/importar-hinario.py — não editar à mão.',
        "import type { HymnFile, HymnIndexEntry } from './types';",
        '',
        'export const hymnIndex: HymnIndexEntry[] = ' + json.dumps(
            [{'kind': e['kind'], 'n': e['n'], 'title': e['title']} for e in index], ensure_ascii=False
        ) + ';',
        '',
        'export const hymnLoaders: Record<string, () => HymnFile> = {',
    ]
    for e in index:
        key = e['file'][:-5]
        lines.append(f"  '{key}': () => require('./{e['file']}'),")
    lines.append('};')
    with open(os.path.join(dest, 'registry.ts'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')
    print(f'{len(index)} arquivos gerados em {dest}')
    for e in errors:
        print('ERRO', e)


if __name__ == '__main__':
    main()
