"""
Gera src/content/mor-materiais.ts a partir das pastas do MOR no Drive da CCB.

Uso:
  python3 scripts/mor/listar_drive.py <id da pasta> > <pasta>/<nome>.tree   (para cada pasta abaixo)
  python3 scripts/mor/gerar.py <pasta com os .tree> src/content/mor-materiais.ts

Pastas (links em congregacaocristanobrasil.org.br/musica/mor):
  v1_planos 1U2COMrGF5WKK4I9THkv8S7CqvedurZiG   v2_planos 1mMJtkmHrK2S0aIwmtSPEL0-f_BUIRu2T
  v1_inter  1Gu4p_DLZFWeODOHAhLAaPdIp3UqbzaPA   v2_inter  1U7KckaVbRU1dZVj5vLh7QzARH2nabpvY
  v1_aval   15B1qgHd-PO40JElyogr3S9u0qWUWJGUc   v2_aval   101Lv6Sho25bGSNkr6b_SUG6B47ImqnK_
"""
import re, json, sys
D = sys.argv[1]
TYPES = {'PDF': 'pdf', 'Microsoft PowerPoint': 'slides', 'Image': 'imagem'}

def parse(path):
    """Árvore indentada → lista de (profundidade, id, nome, tipo)."""
    out = []
    for line in open(path):
        if not line.strip(): continue
        depth = (len(line) - len(line.lstrip(' '))) // 2
        m = re.match(r'(\S+)  (.*?) (Shared folder|PDF|Microsoft PowerPoint|Video|Image)$', line.strip())
        if not m: print('??', line, file=sys.stderr); continue
        out.append((depth, m.group(1), m.group(2).strip(), m.group(3)))
    return out

def clean(name):
    n = re.sub(r'\.(pdf|ppsx|pptx|png|jpe?g)$', '', name, flags=re.I)
    n = re.sub(r'^UN\.?\s?\d+\s*[-–]?\s*', '', n)
    n = re.sub(r'\s+', ' ', n).replace(' _ ', ': ').replace('_ ', ': ').strip(' -')
    if n.isupper(): n = n.capitalize().replace('volume', 'Volume ').replace('  ', ' ')
    return n[0].upper() + n[1:] if n else name

units = {}   # 'v1-u3' -> {grupos: {titulo: [files]}}
volume_files = {1: [], 2: []}

def add(vol, unit, group, fid, name, typ):
    key = f'v{vol}-u{unit}'
    g = units.setdefault(key, {}).setdefault(group, [])
    if fid not in [f['id'] for f in g]:
        g.append({'id': fid, 'title': clean(name), 'type': TYPES[typ]})

def walk(vol, kind, path):
    stack = []  # (depth, name)
    for depth, fid, name, typ in parse(path):
        stack = [s for s in stack if s[0] < depth]
        if typ == 'Shared folder':
            stack.append((depth, name)); continue
        if typ == 'Video': continue  # vídeos ficam de fora (pedido da usuária)
        names = [s[1] for s in stack]
        unit = next((int(m.group(1)) for n in names for m in [re.match(r'UN\.?\s?(\d+)', n)] if m), None)
        if unit is None:
            volume_files[vol].append({'id': fid, 'title': clean(name), 'type': TYPES[typ]}); continue
        infantil = any('nfanti' in n for n in names)
        if kind == 'inter':
            group = 'Slides e figuras' if any('Slides' in n for n in names) else 'Atividades interativas'
        else:
            group = 'Atividades avaliativas infantis' if infantil else 'Atividades avaliativas'
        add(vol, unit, group, fid, name, typ)

for vol in (1, 2):
    walk(vol, 'inter', f'{D}/v{vol}_inter.tree')
    walk(vol, 'aval', f'{D}/v{vol}_aval.tree')

# Planos de aula
planos = {1: {}, 2: {}}
titles = {1: {}, 2: {}}
extra = {1: [], 2: []}
for vol in (1, 2):
    for depth, fid, name, typ in parse(f'{D}/v{vol}_planos.tree'):
        m = re.match(r'Unidade (\d+) - (.*?)\.*\.pdf', name)
        if m:
            planos[vol][int(m.group(1))] = fid; titles[vol][int(m.group(1))] = re.sub(r'\s+', ' ', m.group(2)).strip()
        else:
            extra[vol].append({'id': fid, 'title': 'Planos de aula: ' + clean(name) if 'Todas' in name else clean(name), 'type': 'pdf'})

ORDER = ['Atividades interativas', 'Slides e figuras', 'Atividades avaliativas', 'Atividades avaliativas infantis']
res = {}
for vol in (1, 2):
    for n in sorted(titles[vol]):
        key = f'v{vol}-u{n}'
        g = units.get(key, {})
        res[key] = {
            'volume': vol, 'number': n, 'title': titles[vol][n], 'plano': planos[vol][n],
            'groups': [{'title': t, 'files': g[t]} for t in ORDER if t in g],
        }
    missing = [k for k in units if k.startswith(f'v{vol}-') and k not in res]
    if missing: print('unidades sem plano', missing, file=sys.stderr)

vols = {vol: extra[vol] + volume_files[vol] for vol in (1, 2)}
total = sum(len(f['files']) for u in res.values() for f in u['groups']) + sum(len(v) for v in vols.values()) + len(res)
print('arquivos', total, file=sys.stderr)

ts = ['// Gerado a partir das pastas do MOR no site da CCB (congregacaocristanobrasil.org.br/musica/mor).',
      '// Não edite à mão: rode o gerador de novo quando a CCB publicar materiais novos.',
      '// Vídeos ficam de fora.',
      "import type { MorUnit, MorFile } from './mor-tipos';", '',
      'export const MOR_UNIDADES: MorUnit[] = ' + json.dumps(list(res.values()), ensure_ascii=False, indent=1) + ';', '',
      'export const MOR_VOLUMES: Record<1 | 2, MorFile[]> = ' + json.dumps({str(k): v for k, v in vols.items()}, ensure_ascii=False, indent=1) + ';', '']
open(sys.argv[2], 'w').write('\n'.join(ts))
