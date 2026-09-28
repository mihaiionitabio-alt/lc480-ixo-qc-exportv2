# -*- coding: utf-8 -*-
"""Re-cut the pre-existing tables to the rules: one line per row, fits the page."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texlib import esc, neutral, table, fit_rows

T = '/home/claude/docbuild/latex/tables'
OUT = 'tex/tables'
os.makedirs(OUT, exist_ok=True)

def unesc(s):
    s = re.sub(r'\\(?:footnotesize|scriptsize|tiny|small|textit|textbf|texttt|emph)\b', '', s)
    s = s.replace('{', '').replace('}', '')
    for a, b in (('\\_', '_'), ('\\&', '&'), ('\\%', '%'), ('\\#', '#'), ('\\$', '$'),
                 ('\\textbackslash', '\\'), ('--', '\u2013'), ('~', ' ')):
        s = s.replace(a, b)
    return ' '.join(s.split())

def read_rows(path):
    """Header names and data rows of a longtable/tabular, as plain text."""
    src = open(path, encoding='utf8').read()
    head = None; rows = []
    for line in src.split('\n'):
        t = line.strip()
        if not t or t.startswith('\\begin') or t.startswith('\\end') or t.startswith('\\caption'):
            continue
        if t.startswith('\\toprule'):
            if head is None:
                h = t[len('\\toprule'):]
                h = h.split('\\\\')[0]
                head = [unesc(x) for x in h.split('&')]
            continue
        if t.startswith('\\midrule') or t.startswith('\\bottomrule') or t.startswith('%'):
            continue
        if '&' in t:
            body = t.split('\\\\')[0]
            rows.append([unesc(x) for x in body.split('&')])
    return head, rows

def emit(name, headers, rows, mono, align=None, size='footnotesize', caption=None, label=None):
    n = len(headers)
    rows = [(r + [''] * n)[:n] for r in rows]
    open(os.path.join(OUT, name), 'w', encoding='utf8').write(
        table(headers, rows, size=size, mono=mono, align=align, caption=caption, label=label))
    print(name, len(rows), 'rows')

# ---- the function index, rebuilt from the parsed walk -----------------------
SRC = json.load(open('srcmap.json'))
IDX = {x['name']: x for x in json.load(open('fnindex.json'))}
names = sorted(SRC, key=lambda n: SRC[n]['start'])
rows = [[n, '%d\u2013%d' % (SRC[n]['start'], SRC[n]['end']),
         (IDX.get(n, {}).get('owner') or '')] for n in names]
half = (len(rows) + 1) // 2
pairs = [rows[i] + (rows[i + half] if i + half < len(rows) else ['', '', '']) for i in range(half)]
head = ['Name', 'Lines', 'Inside', 'Name', 'Lines', 'Inside']
mono = [True, False, True, True, False, True]
cut, cap = fit_rows(head, pairs, 'footnotesize', mono)
o = ['{\\footnotesize', '\\begin{longtable}{@{}lll@{\\hspace{6mm}}lll@{}}',
     '\\caption{Functions and constants of the page, with the lines they occupy.}\\label{tab:fnindex} \\\\',
     '\\toprule ' + ' & '.join('\\textbf{%s}' % h for h in head) + ' \\\\ \\midrule\\endfirsthead',
     '\\toprule ' + ' & '.join('\\textbf{%s}' % h for h in head) + ' \\\\ \\midrule\\endhead']
for c in cut:
    o.append(' & '.join(('\\texttt{%s}' % esc(c[i]) if mono[i] and c[i] else esc(c[i])) for i in range(6)) + ' \\\\')
o += ['\\bottomrule', '\\end{longtable}}']
open(os.path.join(OUT, 'fnindex.tex'), 'w', encoding='utf8').write('\n'.join(o) + '\n')
print('fnindex.tex', len(rows), 'symbols')

# ---- the flow map, rebuilt from the parsed walk -----------------------------
BAND = [('sel|SEL_|cmd|CMD|ast|AST|pdf|PDF_', 'view', 'catalogue, selection', 'report or archive'),
        ('mg|MG_', 'view', 'model, findings', 'console item'),
        ('cc|CC_', 'decider', 'history rows', 'limits and signals'),
        ('sop|SOP', 'decider', 'model, profile', 'outcome and reason'),
        ('review|forensic|integrity|extra|westgard|rising', 'decider', 'model', 'findings'),
        ('GRAPHS|svgPlot|draw|graph|gRun|gBy|nice', 'view', 'model, profile', 'drawing and rows'),
        ('rdml|RDML_', 'decoder', 'file bytes', 'run model'),
        ('decode|parse|read|intake|EDS|eds|qs|QS_|ixo|zip|crc32|inflate', 'decoder', 'file bytes', 'run model'),
        ('make|to[A-Z]|export|bundle|csv|pseudo', 'view', 'model, findings', 'file'),
        ('app|APP|show|render|ui|i18n|zh|ZH_|localize', 'view', 'model, state', 'interface')]
def band(n):
    for pat, b, i, o_ in BAND:
        if re.match('^(%s)' % pat, n): return b, i, o_
    return 'utility', 'primitive values', 'value'
rows = []
for n in names:
    b, i, o_ = band(n)
    rows.append([n, '%d\u2013%d' % (SRC[n]['start'], SRC[n]['end']), b, i, o_])
emit('function_flow_map.tex', ['Name', 'Lines', 'Band', 'Takes', 'Gives'], rows,
     [True, False, False, False, False],
     caption='Where each function sits in the flow of the page.', label='tab:function-flow-map')

# ---- the remaining tables, re-cut in place ----------------------------------
SPEC = {
 'catalogue.tex':        (['Code', 'Chart', 'Instr.', 'Default', 'Unit'], [True, False, False, False, False]),
 'graphs.tex':           (['Id', 'Scope', 'Title', 'What it shows'], [True, False, False, False]),
 'forensic_planted.tex': (['Experiment', 'Severity', 'Area', 'Finding and evidence'], [True, False, False, False]),
 'forensic_counts.tex':  (None, None),
 'zip_summary.tex':      (None, None),
 'dataset.tex':          (None, None),
 'cmp.tex':              (None, None),
}
for f, (headers, mono) in SPEC.items():
    path = os.path.join(T, f)
    if not os.path.exists(path): continue
    h, rows = read_rows(path)
    if headers is None:
        headers = h or ['Column %d' % (i + 1) for i in range(len(rows[0]) if rows else 1)]
        mono = [False] * len(headers)
    rows = [[neutral(c) for c in r] for r in rows]
    emit(f, headers, rows, mono)
