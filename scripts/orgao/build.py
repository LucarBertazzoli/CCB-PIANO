"""Monta o arranjo de órgão de cada hino a partir do hinário de órgão impresso."""
import sys, os, json, collections, fitz
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract import extract, segment

BASE = {'treble': 30, 'bass': 18, 'pedal': 18}
NAT = {0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6}
VIDX = {'soprano': 0, 'alto': 1, 'tenor': 2, 'bass': 3}
# Vozes que cada pauta pode conter, na ordem de preferência.
CAND = {'treble': ('soprano', 'alto', 'tenor'), 'bass': ('bass', 'tenor', 'alto'), 'pedal': ('bass', 'tenor')}
STAFF = {'treble': 0, 'bass': 1, 'pedal': 2}
EPS = 1e-6

def diat(m, key=0):
    """Posições diatônicas possíveis da nota, a da armadura primeiro."""
    o, pc = m // 12 - 1, m % 12
    if pc in NAT:
        out = [o * 7 + NAT[pc]]
    else:
        flat, sharp = o * 7 + NAT[pc + 1], o * 7 + NAT[pc - 1]
        out = [flat, sharp] if key < 0 else [sharp, flat]
    if pc == 11: out.append((o + 1) * 7)
    if pc == 0: out.append((o - 1) * 7 + 6)
    if pc == 4: out.append(o * 7 + 3)
    if pc == 5: out.append(o * 7 + 2)
    return out

def weight(col, raw, key):
    """4: toda nota impressa bate com a grafia da armadura; 2: só enarmônica;
    0: não bate. +1 quando todas batem também na oitava (desempata)."""
    w = 4; exact = True
    for d in col:
        sp = [diat(n[0], key) for n in raw]
        if not any(d in x for x in sp): exact = False
        if d % 7 in {x[0] % 7 for x in sp}: continue
        if d % 7 in {y % 7 for x in sp for y in x}: w = 2
        else: return 0
    return w + (1 if exact else 0)

def align(cols, onsets, key, fracs=None, ofracs=None):
    """Casa colunas impressas com ataques, em ordem. Desempata pela posição
    dentro do compasso (fracs: impressa; ofracs: dos dados)."""
    n, m = len(cols), len(onsets)
    def W(i, j):
        w = weight(cols[i], onsets[j][1], key)
        if w and fracs is not None:
            w = w * 4 + 3 * max(0.0, 1 - abs(fracs[i] - ofracs[j]) / 0.25)
        return w
    Wm = [[W(i, j) for j in range(m)] for i in range(n)]
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            dp[i][j] = max(dp[i + 1][j + 1] + Wm[i][j] if Wm[i][j] else 0, dp[i + 1][j], dp[i][j + 1])
    i = j = 0; pairs = []
    while i < n and j < m:
        if Wm[i][j] and dp[i][j] == dp[i + 1][j + 1] + Wm[i][j]: pairs.append((i, j)); i += 1; j += 1
        elif dp[i + 1][j] >= dp[i][j + 1]: i += 1
        else: j += 1
    return pairs, n - len(pairs)

def build(doc, seg, key, data):
    notes = data['notes']  # [midi, início, duração, voz, mão] em batidas
    out, stats = [], {}
    for role in ('treble', 'bass', 'pedal'):
        printed = [c for st in extract(doc, seg) if st['role'] == role for c in st['cols']]
        cols = [[BASE[role] + s for s in c[1]] for c in printed]
        fracs = [c[2] for c in printed]
        by = collections.defaultdict(list)
        for n in notes:
            if n[3] in CAND[role]: by[round(n[1], 6)].append(n)
        onsets = sorted(by.items())
        ms = data['measures'] + [data['end']]
        def ofrac(t):
            for a, b in zip(ms, ms[1:]):
                if a - EPS <= t < b - EPS: return (t - a) / max(b - a, EPS)
            return 0.0
        of = [ofrac(t) for t, _ in onsets]
        pairs, extra = align(cols, onsets, data['key'], fracs, of)
        drift = sum(1 for i, j in pairs if min(abs(fracs[i] - of[j]), 1 - abs(fracs[i] - of[j])) > 0.35)
        attacks = []  # (midi, início, nota bruta)
        for i, j in pairs:
            t, raw = onsets[j]
            used = set()
            for d in sorted(cols[i]):
                best = None
                # 1º a mesma nota na mesma oitava; depois a grafia da armadura em
                # outra oitava; por último a enarmônica. Em cada etapa, a voz
                # preferida da pauta primeiro.
                for stage in ('exata', 'armadura', 'enarmonica'):
                    for v in CAND[role]:
                        for n in raw:
                            if n[3] != v or id(n) in used: continue
                            sp = diat(n[0], data['key'])
                            if stage == 'exata': c = [x for x in sp[:1] if x == d]
                            elif stage == 'armadura': c = [x for x in sp[:1] if x % 7 == d % 7]
                            else: c = [x for x in sp if x % 7 == d % 7]
                            if c:
                                best = (n[0] + 12 * ((d - c[0]) // 7), n); break
                        if best: break
                    if best: break
                if best is None:
                    # a mesma nota bruta serve a duas cabeças (oitava dobrada)
                    for n in raw:
                        c = [x for x in diat(n[0], data['key']) if x % 7 == d % 7]
                        if c: best = (n[0] + 12 * ((d - c[0]) // 7), n); break
                used.add(id(best[1]))
                attacks.append((best[0], t, best[1]))
        # Durações: a nota bruta, emendada com as seguintes da mesma voz e mesma
        # altura enquanto o hinário não ataca de novo essa tecla.
        attack_at = collections.defaultdict(set)
        for midi, t, _ in attacks: attack_at[midi].add(round(t, 6))
        voice_notes = collections.defaultdict(list)
        for n in notes: voice_notes[n[3]].append(n)
        for v in voice_notes: voice_notes[v].sort(key=lambda n: n[1])
        seen = set(); covered = 0
        for midi, t, n0 in sorted(attacks, key=lambda a: (a[1], a[0])):
            if (midi, round(t, 6)) in seen: continue
            seen.add((midi, round(t, 6)))
            end = n0[1] + n0[2]
            seq = voice_notes[n0[3]]
            k = seq.index(n0) + 1
            while k < len(seq) and abs(seq[k][1] - end) < EPS and seq[k][0] == n0[0] and round(seq[k][1], 6) not in attack_at[midi]:
                end = seq[k][1] + seq[k][2]; k += 1
            # nunca passa do próximo ataque da mesma tecla nesta pauta
            nxt = [x for x in attack_at[midi] if x > t + EPS]
            if nxt: end = min(end, min(nxt))
            voice = 'pedal' if role == 'pedal' else n0[3]
            out.append([midi, round(t * 480), round((end - t) * 480), 4 if role == 'pedal' else VIDX[voice], STAFF[role]])
        stats[role] = (len(cols), len(pairs), extra, drift)
    return out, stats

if __name__ == '__main__':
    pdf, raw_path, hin_dir = sys.argv[1:4]
    only = [int(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 and sys.argv[4] else None
    doc = fitz.open(pdf); raw = json.load(open(raw_path)); seg = segment(doc)
    report = {}
    for (kind, n), parts in sorted(seg.items()):
        if only and (kind != 'hino' or n not in only): continue
        key = f'{kind}-{n:03d}'
        if key not in raw: continue
        organ, stats = build(doc, parts, key, raw[key])
        report[key] = stats
        path = os.path.join(hin_dir, key + '.json')
        f = json.load(open(path, encoding='utf-8'))
        f['organ'] = sorted(organ, key=lambda x: (x[1], x[4], x[0]))
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump(f, fh, ensure_ascii=False, separators=(',', ':'))
    json.dump(report, open('organ_report.json', 'w'))
    print(len(report), 'hinos com arranjo do hinário de órgão')
