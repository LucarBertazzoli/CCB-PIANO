"""Lê as notas (cabeças) do hinário de órgão em PDF vetorial."""
import fitz

ROLES = ['treble', 'bass', 'pedal']
_CACHE = {}

def drawings(pg):
    """Desenhos da página (lidos uma vez só)."""
    k = (id(pg.parent), pg.number)
    if k not in _CACHE: _CACHE[k] = pg.get_drawings()
    return _CACHE[k]

def page_items(pg, arcs=None):
    """Linhas de pauta, cabeças de nota e (opcional) arcos, com tamanhos
    relativos ao espaço entre as linhas da pauta da página."""
    lines, shapes = [], []
    for d in drawings(pg):
        r = d['rect']; kinds = ''.join(it[0] for it in d['items'])
        if kinds == 're' and r.width > 150 and r.height < 1.2:
            lines.append((r.x0, r.x1, (r.y0 + r.y1) / 2))
        else:
            shapes.append((kinds, r))
    st = staves(lines)
    sp = sorted((g[4] - g[0]) / 4 for g in st)[len(st) // 2] if st else 4.05
    heads = []
    for kinds, r in shapes:
        if kinds in ('cccc', 'cccccccc', 'ccccccccc') and 1.1 * sp <= r.width <= 2.3 * sp and 0.75 * sp <= r.height <= 1.4 * sp:
            heads.append({'x': (r.x0 + r.x1) / 2, 'y': (r.y0 + r.y1) / 2, 'hollow': kinds != 'cccc'})
        elif arcs is not None and 'c' in kinds and set(kinds) <= {'c', 'l'} and len(kinds) <= 12 and r.width >= 1.5 * sp and r.height <= 3.5 * sp:
            arcs.append(r)
    return lines, heads

def staves(lines):
    ys = sorted(set(round(l[2], 1) for l in lines))
    groups, cur = [], []
    for y in ys:
        if cur and y - cur[-1] > 8: groups.append(cur); cur = []
        cur.append(y)
    if cur: groups.append(cur)
    return [g for g in groups if len(g) == 5]

def titles(pg):
    out = []
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if s['text'].strip().isdigit() and s['size'] > 20:
                    out.append((s['bbox'][1], int(s['text'].strip())))
    return sorted(out)

def segment(doc, first=8, last=535):
    """{('hino'|'coro', n): [(página, [pautas])]} na ordem de leitura."""
    seg, cur, kind = {}, None, 'hino'
    for pno in range(first, min(last, len(doc))):
        pg = doc[pno]
        if 'COROS' in pg.get_text().replace(' ', ''): kind = 'coro'
        lines, _ = page_items(pg)
        st = staves(lines)
        marks = titles(pg)
        for g in st:
            above = [n for y, n in marks if y < g[0]]
            if above: cur = (kind, above[-1])
            if cur is None: continue
            seg.setdefault(cur, {}).setdefault(pno, []).append(g)
    return {k: sorted(v.items()) for k, v in seg.items()}

def tied(heads, arcs, sp):
    """Marca a cabeça da direita de cada ligadura (mesma altura): não é ataque."""
    for a in arcs:
        right = [h for h in heads if a.x1 - 0.5 * sp <= h['x'] <= a.x1 + 2.2 * sp and a.y0 - sp * 3.2 <= h['y'] <= a.y1 + sp * 3.2]
        left = [h for h in heads if a.x0 - 2.2 * sp <= h['x'] <= a.x0 + 0.5 * sp and a.y0 - sp * 3.2 <= h['y'] <= a.y1 + sp * 3.2]
        for r in right:
            if any(abs(l['y'] - r['y']) < sp * 0.3 for l in left):
                r['tied'] = True

def extract(doc, parts, keep_tied=False):
    """parts: [(página, [pautas])] → [{'role', 'cols': [[x, [passos]]]}]"""
    out = []
    for pno, groups in parts:
        arcs = []
        lines, heads = page_items(doc[pno], arcs)
        allst = staves(lines)
        sp0 = sorted((g[4] - g[0]) / 4 for g in allst)[len(allst) // 2] if allst else 4.05
        tied(heads, arcs, sp0)
        for i, g in enumerate(groups):
            role = ROLES[i % 3]
            top, bottom = g[0], g[4]; sp = (bottom - top) / 4
            mine = [h for h in heads if min(allst, key=lambda gg: abs((gg[0] + gg[4]) / 2 - h['y'])) == g and (keep_tied or not h.get('tied'))]
            mine.sort(key=lambda h: h['x'])
            cols = []
            for h in mine:
                step = round((bottom - h['y']) / (sp / 2))
                # Segunda: as duas cabeças ficam lado a lado (mesmo tempo).
                second = cols and abs(h['x'] - cols[-1][0]) < 2 * sp and any(abs(step - t) <= 1 for t in cols[-1][1])
                if cols and (abs(h['x'] - cols[-1][0]) < 0.9 * sp or second): cols[-1][1].add(step)
                else: cols.append([h['x'], {step}])
            # Posição de cada coluna dentro do compasso (0..1), pelas barras.
            sys_top = min(gg[0] for gg in groups[i - i % 3:i - i % 3 + 3])
            sys_bot = max(gg[4] for gg in groups[i - i % 3:i - i % 3 + 3])
            sys_heads = [hh['x'] for hh in heads if sys_top - 6 * sp <= hh['y'] <= sys_bot + 6 * sp]
            left = (min(sys_heads) - 0.6 * sp) if sys_heads else 0
            right = max(l[1] for l in lines if abs(l[2] - g[0]) < 0.5)
            bars = [x for x in barlines(doc[pno], g, sp) if left < x < right - 1.5 * sp]
            edges = [left] + bars + [right]
            def frac(x):
                for a, b in zip(edges, edges[1:]):
                    if a <= x < b: return (x - a) / max(b - a, 1e-6)
                return 0.0
            out.append({'page': pno, 'role': role, 'cols': [[c[0], sorted(c[1]), frac(c[0])] for c in cols], 'y': top})
    return out

def barlines(pg, g, sp):
    """Posições x das barras de compasso internas de uma pauta (sem a do fim do sistema)."""
    xs = []
    for d in drawings(pg):
        r = d['rect']
        if len(d['items']) == 1 and d['items'][0][0] == 're' and 0.5 <= r.width <= 0.9 and r.y0 <= g[0] + 0.3 * sp and r.y1 >= g[4] - 0.3 * sp and r.height <= 4.5 * sp:
            xs.append((r.x0 + r.x1) / 2)
    xs.sort()
    out = []
    for x in xs:
        if out and x - out[-1] < 2.5 * sp: out[-1] = x   # barra dupla: fica a da direita
        else: out.append(x)
    return out

def measure_map(doc, parts):
    """Para cada pauta (na ordem de extract), as barras e o compasso inicial."""
    res = []; count = {r: 0 for r in ROLES}
    for pno, groups in parts:
        pg = doc[pno]
        lines, heads = page_items(pg)
        for i, g in enumerate(groups):
            role = ROLES[i % 3]; sp = (g[4] - g[0]) / 4
            xs = barlines(pg, g, sp)
            # a barra no fim do sistema fecha o último compasso: não abre outro
            right = max(l[1] for l in lines if abs(l[2] - g[0]) < 0.5)
            inner = [x for x in xs if x < right - 1.5 * sp]
            res.append((count[role], inner))
            count[role] += len(inner) + 1
    return res
