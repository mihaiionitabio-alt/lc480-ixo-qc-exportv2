"""Line range in the production HTML for every symbol the probe indexed."""
import json, re
H = open('prod.html', encoding='utf8', errors='replace').read().split('\n')
IDX = {}
for x in json.load(open('fnindex.json')):
    if x['name'] not in IDX: IDX[x['name']] = x          # first declaration wins
probe = json.load(open('validation_full.json'))
names = [r['name'] for r in probe['rows']]

def find_decl(name):
    pat = re.compile(r'^\s*(?:async\s+)?(?:function\s+%s\s*\(|(?:const|let|var)\s+%s\s*=)' % (re.escape(name), re.escape(name)))
    for i, l in enumerate(H, 1):
        if pat.match(l): return i
    return None

def extent(a):
    """From line a, close the block the declaration opens.

    Only braces and brackets delimit the body; parentheses are neutral, because a
    function's parameter list would otherwise close the statement on its own line.
    Strings, template literals, line and block comments are skipped."""
    depth = 0; started = False; st = None; i = a - 1
    while i < len(H):
        line = H[i]; j = 0
        while j < len(line):
            ch = line[j]
            if st:
                if ch == '\\': j += 2; continue
                if ch == st: st = None
                j += 1; continue
            if ch in '"\'`': st = ch; j += 1; continue
            if ch == '/' and j + 1 < len(line) and line[j+1] == '/': break
            if ch in '{[': depth += 1; started = True
            elif ch in '}]':
                depth -= 1
                if started and depth <= 0: return i + 1
            j += 1
        if started and depth <= 0: return i + 1
        if not started and line.rstrip().endswith(';'): return i + 1
        i += 1
    return a

out = {}
for n in names:
    if n in IDX and IDX[n].get('start'):
        a, b, src = IDX[n]['start'], IDX[n]['end'], 'parsed'
    else:
        a = find_decl(n)
        if not a: out[n] = None; continue
        b = extent(a); src = 'declaration scan'
    a = max(1, a); b = min(len(H), max(a, b))
    out[n] = {'start': a, 'end': b, 'lines': b - a + 1, 'via': src,
              'code': '\n'.join(H[a-1:b])}
json.dump(out, open('srcmap.json', 'w'), indent=1)
miss = [n for n, v in out.items() if not v]
tot = sum(v['lines'] for v in out.values() if v)
print('mapped', sum(1 for v in out.values() if v), 'of', len(names), 'missing', miss)
print('total source lines to print:', tot)
