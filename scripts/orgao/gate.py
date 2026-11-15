"""Controle de qualidade do arranjo impresso, hino a hino."""
import json, sys, os
raw = json.load(open(sys.argv[1])); d = sys.argv[2]
MAIN = {0: ('soprano', 'alto'), 1: ('tenor', 'bass'), 2: ('bass',)}
ok, out = [], []
for key, data in sorted(raw.items()):
    org = json.load(open(os.path.join(d, key + '.json'))).get('organ', [])
    if not org: continue
    notes = data['notes']
    # notas estranhas: classe de altura que nenhuma voz canta no início da nota
    strange = 0
    for m, s, du, v, st in org:
        t = s / 480
        sounding = {n[0] % 12 for n in notes if n[1] - 1e-6 <= t < n[1] + n[2] - 1e-6}
        if m % 12 not in sounding: strange += 1
    miss = total = 0
    for staff, voices in MAIN.items():
        for m, s, du, v, h in notes:
            if v not in voices: continue
            total += 1; t = round(s * 480)
            snd = lambda os_: any(o[1] <= t < o[1] + o[2] and o[0] % 12 == m % 12 for o in os_)
            on = [o for o in org if o[4] == staff]
            if not (snd(on) or (v == 'bass' and snd([o for o in org if o[4] == 2])) or (staff != 2 and snd([o for o in org if o[4] != 2]))):
                miss += 1
    good = strange == 0 and miss <= 0.03 * total
    (ok if good else out).append((key, strange, miss, total))
print('aprovados', len(ok), 'reprovados', len(out))
print(out[:40])
json.dump([k for k, *_ in ok], open(sys.argv[3], 'w'))
