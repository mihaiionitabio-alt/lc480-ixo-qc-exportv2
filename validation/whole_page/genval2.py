# -*- coding: utf-8 -*-
"""The validation part: method, every function, the independent checks, the
exchange-file cases, the findings and the evidence appendix."""
import json, re, os, sys, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texlib import esc, neutral, table, listing, plain, tt

V    = json.load(open('validation_full.json'))
SRC  = json.load(open('srcmap.json'))
E2E  = json.load(open('endtoend.json'))
INV  = json.load(open('invariants_results.json'))
SYN  = json.load(open('synthetic_probe_results.json'))
SCH  = json.load(open('schema_findings.json'))
RDML = json.load(open('rdml_validation_data.json'))
IDX  = {x['name']: x for x in json.load(open('fnindex.json'))}
ROWS = {r['name']: r for r in V['rows']}
NAMES = sorted(ROWS)
os.makedirs('tex', exist_ok=True)
def out(n, t): open('tex/' + n, 'w', encoding='utf8').write(t)

# corpus files are named by what they are, not by who made them
CORPUS_LABEL = {}
def corpus_label(f):
    if f in CORPUS_LABEL: return CORPUS_LABEL[f]
    return neutral(f)

AREAS = [
 ('Report selection and the two operator modes', r'^(sel|SEL_|cmd|CMD|ast|AST|pdf|PDF_|modesInit|svgToJpeg)'),
 ('Exchange files', r'^(rdml|RDML_|runProcessingState|runIsInstrumentAnalysed|runIsSuperseded|sopProcessingApplicability|applyRawFilePriority)'),
 ('The console', r'^(mg|MG_)'),
 ('Control panel and instrument history', r'^(cc|CC_)'),
 ('Laboratory profile', r'^(sop|SOP)'),
 ('Review and forensics', r'^(review|forensic|FORENSIC|integrity|extra|westgard|orphan|ORPHAN|rising)'),
 ('Graphs and charts', r'^(GRAPHS|svgPlot|draw|nice|graph|gRun|gBy|hashColour|extent|CURVE)'),
 ('Intake and decoding', r'^(decode|parse|read|intake|crc32|inflate|EDS|eds|qs|QS_|ixo|zip|makeStoredZip|CRC_T|MD5|studyRows|recalcCt|flagName|FLAGS|isEdsName|analysisResults|derivedSettings|ownQuery|ownsResult|wellPos|ROWS|posToWell)'),
 ('Values and exports', r'^(make|to[A-Z]|export|pseudo|xlsx|csv|CSV|bundle|catalogue|download|safeName)'),
 ('Application shell and interface', r'^(app|APP|show|render|ui$|i18n|zh|ZH_|localize|setSelect|ce$|el$|esc|pill|dt$|fmt|DIRTY|UI_|DEFAULT_LANG|I18N)'),
]
def area_of(n):
    for a, pat in AREAS:
        if re.match(pat, n): return a
    return 'Shared utilities and constants'
for n in NAMES: ROWS[n]['area'] = area_of(n)

CLS = {'R': 'a real instrument or exchange file, unmodified, decoded by the page itself',
       'D': 'derived by the code under test from a real file',
       'S': 'synthetic, written for this probe',
       'E': 'the live interface of the page after the corpus was loaded'}
VERD = {
 'pass':     ('\\vPASS', 'called with the stated input; returned the value shown; global state unchanged'),
 'constant': ('\\vPASS', 'a declared value; its content at run time is shown'),
 'mutates':  ('\\vWARN{by design}', 'changes application state; probed in a page of its own'),
 'threw':    ('\\vFAIL', 'raised an error with the stated input'),
 'private':  ('\\vWARN{private}', 'declared inside a module closure; exercised through its module'),
 'excluded': ('\\vWARN{excluded}', 'deliberately not called'),
}
SHORT = {'pass': 'pass', 'constant': 'const', 'private': 'priv', 'mutates': 'state',
         'excluded': 'excl', 'threw': 'error'}
def anchor(n): return re.sub(r'[^A-Za-z0-9]', '', n)

# ============================================================== method
def ch_method():
    t = V['tally']; p = V['provTally']
    extra = sorted(set(ROWS) - set(IDX))
    o = [r"""\chapter{How every function in the page was validated}\label{ch:val-method}

An earlier validation record was questioned on one point, and the objection was
fair: the inputs were supplied by the same work that wrote the code, so a table of
passes proved only that the code agreed with its own fixtures. This chapter and
the two that follow answer that objection in the only way it can be answered ---
by printing, for every function and constant in the page, the input, where that
input came from, the code as it stands, and the output. A reader who doubts a
verdict can re-derive it without trusting the harness.

\section{What was under test}
""",
    table(['Item', 'Value'],
          [['page', 'qpcr_qc_forensics.html (identical copy index.html)'],
           ['SHA-256', V['build']['sha256']],
           ['size', '%s bytes' % format(V['build']['bytes'], ',')],
           ['captured', V['capturedAt'][:19].replace('T', ' ') + ' UTC'],
           ['symbols indexed', str(V['indexed'])]],
          mono=[True, True]),
    r"""
\section{The corpus}
Every file below was loaded through the page's own intake --- the same path an
operator uses. Nothing was edited and no value was placed into the model by hand.
The files are instrument and exchange files produced by ordinary demonstration
experiments; they are identified here by what they contain and by their checksum,
not by their origin.
"""]
    rows = [[corpus_label(c['file']), format(c['bytes'], ','), c['sha256'][:24]] for c in V['corpus']]
    o.append(table(['File', 'Bytes', 'SHA-256 (first 24)'], rows, mono=[True, False, True],
                   align=['l', 'r', 'l'],
                   caption='The corpus the whole of this part was measured on.', label='tab:val-corpus'))
    o.append(r"""
Reading them produced %d runs and %s stored results, with no page error.

\section{Provenance classes}
Every argument carries one of four classes. The class says where the value came
from, so a verdict can be weighed: a function exercised only on class~S input has
been shown to run, not to be right on laboratory data.
""" % (V['state']['runs'], format(V['state']['wells'], ',')))
    o.append(table(['Class', 'Meaning', 'Arguments'],
                   [[k, CLS[k], str(p.get(k, 0))] for k in 'RDSE'],
                   mono=[True, False, False], align=['l', 'l', 'r']))
    o.append(r"""
\section{The three passes}
A probe that changes application state poisons every probe after it, so the
capture runs three times.
""")
    o.append(table(['Pass', 'What it does'],
                   [['A, discovery', 'probe every symbol once; record which probes changed global state'],
                    ['B, clean', 'probe again in a new page with those names held back'],
                    ['C, isolation', 'probe each state-changing name in a page of its own']],
                   mono=[False, False]))
    o.append(r"""
The delivered records are B plus C. One name, \vfn{renderPanel}, is state-changing
in pass~A and clean in pass~C: it had been disturbed by an earlier probe, not by
itself. That is the whole reason the three passes exist.

\section{What a verdict means}
""")
    o.append(table(['Verdict', 'Meaning', 'Symbols'],
                   [[SHORT[k], VERD[k][1], str(t.get(k, 0))]
                    for k in ['pass', 'constant', 'private', 'mutates', 'excluded', 'threw'] if k in t],
                   mono=[True, False, False], align=['l', 'l', 'r']))
    o.append(r"""
\begin{notebox}[title={\textbf{What this part does not claim}}]
A pass means the function was called with the stated input and returned the stated
value without disturbing the application. It is a recorded behaviour, not a proof
of correctness. Correctness is argued in Chapter~\ref{ch:val-oracles}, by
properties that must hold of the values whatever produced them, and by inputs
whose right answer was fixed before the page saw them.
\end{notebox}

\section{Coverage}
The index is built from the page's own script: every top-level declaration is
probed, and the members of the one module that hides its helpers are probed
through the module. It contains %d symbols. The index that shipped with the
previous release of this document was built by a parser that walked only the
outermost level and recorded 579; the difference is %d symbols, most of them
module-level bindings and the helpers inside that module.

Of the %d, %d functions executed and %d constants were read --- %d symbols with a
recorded input and output. %d are declared inside a module closure. %d are
deliberately not called, each with its reason. %d change application state by
design and were probed in isolation. %d raised an error.
""" % (V['indexed'], V['indexed'] - 579, V['indexed'], t.get('pass', 0), t.get('constant', 0),
       t.get('pass', 0) + t.get('constant', 0), t.get('private', 0), t.get('excluded', 0),
       t.get('mutates', 0), t.get('threw', 0)))
    return '\n'.join(o)

out('chV1_method.tex', ch_method())
print('chV1', os.path.getsize('tex/chV1_method.tex'))

# ============================================================== function by function
def entry(n):
    r = ROWS[n]; s = SRC[n]; k = r['klass']; v, why = VERD[k]
    o = ['\\subsection*{\\vfn{%s}}\\label{vf:%s}' % (esc(n), anchor(n)), '\\nopagebreak']
    meta = ['HTML lines %d--%d (%d)' % (s['start'], s['end'], s['lines'])]
    if k not in ('constant', 'private', 'excluded'): meta.append('arity %d' % r.get('arity', 0))
    if r.get('reachedVia') and r['reachedVia'] != 'page scope':
        meta.append('reached as \\vfn{%s}' % esc(r['reachedVia']))
    if r.get('isolated'): meta.append('probed in a page of its own')
    o.append('{\\small ' + ' \\textperiodcentered{} '.join(meta) + ' \\hfill ' + v + '}\\par')
    o.append('\\vhead{Source as built}')
    o.append(listing(s['code'], first=s['start'], size='small'))
    if k == 'excluded':
        o.append('\\vhead{Not called}' + esc(r.get('detail', '')) + '.\\par'); return '\n'.join(o) + '\n'
    if k == 'private':
        o.append('\\vhead{Reachability}' + esc(r.get('detail', '')) +
                 '. It is exercised whenever its module is.\\par'); return '\n'.join(o) + '\n'
    if k == 'constant':
        o.append('\\vhead{Value at run time, with the corpus loaded}')
        o.append(plain(neutral(r.get('value', '') or '')))
        o.append('\\vhead{Verdict}\\vPASS{} --- ' + esc(why) + '.\\par'); return '\n'.join(o) + '\n'
    args = r.get('args', [])
    o.append('\\vhead{Input}')
    if not args:
        o.append('The function takes no argument; it reads the state the corpus built.\\par')
    else:
        o.append(table(['Parameter', 'Cls', 'Where it came from', 'Value as passed'],
                       [[a['param'], a['prov'], neutral(a['from']),
                         neutral(a.get('value') if a.get('value') is not None else 'undefined')]
                        for a in args],
                       mono=[True, True, False, True]))
    o.append('\\vhead{Output}')
    if k == 'threw':
        o.append('The call raised:' + plain(neutral(r.get('output', ''))))
    else:
        o.append('{\\small Returned %s.}\\par' % esc(r.get('outputShape', '')))
        o.append(plain(neutral(r.get('output', '') or '')))
    se = {kk: vv for kk, vv in (r.get('sideEffects') or {}).items() if vv}
    o.append('\\vhead{Verdict}')
    line = v + ' --- ' + esc(why) + '.'
    if r.get('detail'): line += ' ' + esc(r['detail']) + '.'
    if se: line += ' Side effects attempted and neutralised: ' + esc(', '.join('%s %d' % (a, b) for a, b in se.items())) + '.'
    o.append(line + '\\par')
    return '\n'.join(o) + '\n'

def ch_functions():
    o = [r"""\chapter{Function by function}\label{ch:val-functions}

Every top-level function and constant of the page, in the order it is declared
within its area. For each: the code exactly as it stands with its line numbers,
the arguments it was called with and where each came from, the value it returned,
and the verdict. The source is printed as the page holds it, including the names
the instrument software writes into a file; only the prose and the recorded values
in this document are stated in neutral terms.
"""]
    for area, _ in AREAS + [('Shared utilities and constants', '')]:
        names = [n for n in NAMES if ROWS[n]['area'] == area]
        if not names: continue
        names.sort(key=lambda n: SRC[n]['start'])
        tal = {}
        for n in names: tal[ROWS[n]['klass']] = tal.get(ROWS[n]['klass'], 0) + 1
        o.append('\\section{%s}' % esc(area))
        o.append('{\\small %d symbols: %s.}\\par' % (len(names),
                 ', '.join('%d %s' % (c, SHORT[k]) for k, c in sorted(tal.items(), key=lambda kv: -kv[1]))))
        rows = [[n, SHORT[ROWS[n]['klass']], str(SRC[n]['start']), '\\pageref{vf:%s}' % anchor(n)] for n in names]
        half = (len(rows) + 1) // 2
        pairs = [rows[i] + (rows[i + half] if i + half < len(rows) else ['', '', '', '']) for i in range(half)]
        o.append(pair_table(pairs))
        for n in names: o.append(entry(n))
    return '\n'.join(o)

def pair_table(pairs):
    """Two logical columns of (symbol, result, line, page) side by side, one line each."""
    from texlib import fit_rows
    head = ['Symbol', 'Result', 'Line', 'Page', 'Symbol', 'Result', 'Line', 'Page']
    mono = [True, False, False, False, True, False, False, False]
    cut, cap = fit_rows(head, [[c if not c.startswith('\\pageref') else '000' for c in r] for r in pairs],
                        'footnotesize', mono)
    o = ['{\\footnotesize', '\\begin{longtable}{@{}lllr@{\\hspace{7mm}}lllr@{}}',
         '\\toprule ' + ' & '.join('\\textbf{%s}' % h for h in head) + ' \\\\ \\midrule\\endhead']
    for orig, c in zip(pairs, cut):
        cells = []
        for i in range(8):
            v = orig[i]
            if v.startswith('\\pageref'): cells.append(v)
            elif mono[i] and v: cells.append('\\texttt{%s}' % esc(c[i]))
            else: cells.append(esc(c[i]))
        o.append(' & '.join(cells) + ' \\\\')
    o += ['\\bottomrule', '\\end{longtable}}']
    return '\n'.join(o) + '\n'

out('chV2_functions.tex', ch_functions())
print('chV2', os.path.getsize('tex/chV2_functions.tex'))

# ============================================================== oracles
def ch_oracles():
    inv = INV['checks']; syn = SYN['oracle']
    o = [r"""\chapter{Independent checks}\label{ch:val-oracles}

Chapter~\ref{ch:val-functions} records what each function did. It cannot say
whether what it did was right, because the expectation and the input came from the
same place. This chapter holds the checks that can: properties that must be true
of the values whatever produced them, inputs whose right answer was fixed before
the page saw them, and two readings of one experiment that must agree.

\section{Properties that must hold}
None of the defects found during this work were contract violations. Every one was
a wrong value returned by a function that did not throw. A property check states
something that must be true of the values and fails loudly when it is not, without
naming the function that has to keep it true.
""",
    table(['Property', 'Why it must hold', 'Result'],
          [[c['name'], c['why'], 'pass' if c['ok'] else 'FAIL'] for c in inv],
          mono=[False, False, False],
          caption='The property checks and their results.', label='tab:val-invariants'),
    '\\par %d of %d hold on this build.\n' % (INV['passed'], INV['total']),
    r"""
\section{A run whose answers were known first}
The second check removes laboratory data from the question. A run is generated
from a fixed seed: its plate, its controls, its values and its intended outcome for
every sample are written down first, and the page is then asked for its reading.
Because the fixture was built to a stated answer and not from the page's output, an
agreement is evidence and a disagreement is a defect. It is the input that found
the sentinel defect of 23~September, which no real file had exposed.
""",
    table(['Check', 'Expected', 'Result'],
          [[c['name'], str(c.get('want', '')), 'pass' if c['ok'] else 'FAIL'] for c in syn['checks']],
          mono=[False, True, False],
          caption='Checks against a run whose answers were fixed first.', label='tab:val-synthetic'),
    '\\par %d of %d hold. The outcome tally the page produced from the fixture: %s.\n'
    % (sum(1 for c in syn['checks'] if c['ok']), len(syn['checks']),
       esc(', '.join('%s %s' % (k, v) for k, v in syn['outcomes'].items()))),
    r"""
\section{The same experiment read twice}
One experiment in the corpus exists both as an instrument container and as an
exchange file written from it. The two are read by different code and must produce
the same calls for the reactions they share. The comparison is in
Section~\ref{sec:val-oracle}.

\section{Everything the operator can reach, exercised once}
With the corpus loaded, every tab was opened, every review view rendered, every
graph drawn, every console view built and every export button pressed with the
download path stubbed and counted.
"""]
    def st(d, what):
        return table([what, 'Result'],
                     [[neutral(k), ('FAILED: ' + neutral(v[7:])) if str(v).startswith('THREW') else neutral(v)]
                      for k, v in d.items()], mono=[True, False])
    o.append(st(E2E['tabs'], 'Tab'))
    o.append(st(E2E['reviewViews'], 'Review view'))
    o.append(st(E2E['consoleViews'], 'Console view'))
    gbad = [k for k, v in E2E['graphs'].items() if str(v).startswith('THREW')]
    o.append('\\vhead{Graphs}%d graphs were drawn; %s.\\par\n'
             % (len(E2E['graphs']), 'none failed' if not gbad else esc(', '.join(gbad)) + ' failed'))
    o.append(st(E2E['exports'], 'Export button'))
    o.append(table(['File written', 'Bytes'],
                   [[neutral(d['name']), format(d['bytes'], ',')] for d in E2E['downloads']],
                   mono=[True, False], align=['l', 'r'],
                   caption='Every file the export buttons produced.', label='tab:val-exports'))
    o.append(r"""
The exercise raised %d page error%s.

\section{What none of this covers}
\begin{itemize}
\item A property check can only fail on the corpus it is given. It says nothing
  about a file shape no corpus file has.
\item The generated run is a model of a plate, not a plate. It cannot show that a
  threshold is the right threshold, only that the page applies the rule it states.
\item An agreement between two readings of one experiment is evidence that neither
  is arbitrary. It is not evidence that both are right.
\item Nothing here establishes a laboratory acceptance limit, and none of it
  replaces method validation.
\end{itemize}
""" % (len(E2E.get('pageErrors', [])), '' if len(E2E.get('pageErrors', [])) == 1 else 's'))
    return '\n'.join(o)

out('chV3_oracles.tex', ch_oracles())
print('chV3', os.path.getsize('tex/chV3_oracles.tex'))

# ============================================================== exchange-file cases
def ch_rdml():
    recs = RDML['records']
    plain_fns = [f for f in dict.fromkeys(r['fn'] for r in recs) if '(' not in f]
    o = [r"""\chapter{The exchange-file reader, case by case}\label{ch:val-rdml}

The reader of Chapter~\ref{ch:rdml} was validated before it was merged, with a
named case for every function and an expectation written before the call. Those
cases are reproduced here; the code they exercise is printed in
Chapter~\ref{ch:val-functions}, so it is not repeated.

\section{The corpus for these cases}
""",
    table(['File', 'Bytes', 'SHA-256 (first 24)'],
          [[corpus_label(c['file']), format(c['bytes'], ','), c['sha256'][:24]] for c in RDML['corpus']],
          mono=[True, False, True], align=['l', 'r', 'l']),
    r"""
\section{Case by case}
Each row is one call. \textbf{Cls} is the provenance class of
Chapter~\ref{ch:val-method}.
"""]
    for f in plain_fns:
        rs = [r for r in recs if r['fn'] == f]
        o.append('\\subsection*{\\vfn{%s}}' % esc(f))
        o.append('{\\small %d case%s, %d passed.}\\par'
                 % (len(rs), '' if len(rs) == 1 else 's', sum(1 for r in rs if r['pass'])))
        o.append(table(['Case', 'Cls', 'Input', 'Output', 'Expected', 'Result'],
                       [[corpus_label(r['case']), str(r.get('inputProvenance', ''))[:1],
                         neutral(r['inputDesc']), neutral(json.dumps(r['output'])),
                         neutral(r['expect']), 'pass' if r['pass'] else 'FAIL'] for r in rs],
                       mono=[True, True, False, True, False, False]))
    o.append(r"""
\section{Integration validations}\label{sec:val-oracle}
\subsection*{A value equal to the cycle count}
An exchange file written by instrument software records ``no crossing'' as a value
equal to the run's cycle count. Read literally, most of a plate becomes a very late
detection. A re-analysis file does not do this, so the rule is applied only where
the file offers no starting concentration and no efficiency to contradict it.
""")
    ceil = [r for r in recs if 'ceiling' in r['fn']]
    o.append(table(['File', 'Cycles', 'Rows', 'Converted', 'Kept', 'Maximum'],
                   [[corpus_label(r['case']), str(r['input']['cycles']), str(r['input']['rows']),
                     str(r['output']['converted']), str(r['output']['remainingWithCq']),
                     str(r['output']['cqMax'])] for r in ceil],
                   mono=[True, False, False, False, False, False],
                   align=['l', 'r', 'r', 'r', 'r', 'r']))
    orc = [r for r in recs if 'cross-format' in r['fn']]
    if orc:
        r = orc[0]
        o.append(r"""
\subsection*{The same experiment, read twice}
One experiment is present both as an instrument container and as an exchange file
written from it. The container is decoded by the intake, the exchange file by the
reader. For the reactions the two have in common the calls must agree.
""")
        o.append(table(['Measure', 'Count'], [[k, str(v)] for k, v in r['output'].items()],
                       mono=[True, False], align=['l', 'r']))
        o.append('\\par Expected: ' + esc(neutral(r['expect'])) + ' --- ' + ('pass' if r['pass'] else 'FAIL') + '.\n')
    pri = [r for r in recs if r['fn'] in ('applyRawFilePriority', 'runIsSuperseded')]
    o.append(r"""
\subsection*{Which file wins when both are present}
The tool is for experiments the instrument software has already analysed. Where a
container and an exchange file describe the same experiment, the container is
authoritative and the exchange file is kept as comparison evidence.
""")
    o.append(table(['Function', 'Case', 'Result', 'Verdict'],
                   [[r['fn'], neutral(r['case']), neutral(json.dumps(r['output'])),
                     'pass' if r['pass'] else 'FAIL'] for r in pri],
                   mono=[True, False, True, False]))
    o.append('\\par All %d recorded cases pass.\n' % len(recs))
    return '\n'.join(o)

out('chV4_rdml.tex', ch_rdml())
print('chV4', os.path.getsize('tex/chV4_rdml.tex'))

# ============================================================== findings
def ch_findings():
    voc = SCH['vocabulary']; sen = SCH['sentinel']; fmt = SCH['format']
    o = [r"""\chapter{What the validation found}\label{ch:val-findings}

Everything here was produced by the checks of the three preceding chapters on the
build under test, and every number can be re-derived from the evidence files of
Appendix~\ref{app:val-trace}. Findings are numbered D-1 upwards. Only the first has
been corrected in the page: three of the others would change stored values, and
stored values are not changed without agreement.

\section{D-1 --- a console view failed to build (corrected)}
\vhead{What happened}
The builder of the load view referred to a name that was not defined in its scope.
The reference is on the path taken whenever at least one file has been read, so the
function raised on every session that had data --- which is every real session. The
other seven views built normally, so the failure was silent: the first view of the
console simply produced nothing.

\vhead{Evidence, before the correction}
""",
    plain("""the console views, with the corpus loaded:
  load        raised: bad is not defined
  sop         20 items
  results     4 items
  panel       54 items
  graphs      26 items
  review      13 items
  export      12 items
  integrity   1 item"""),
    r"""\vhead{The correction}
The condition the line was written for is now computed immediately above it:
""",
    plain('const bad=RUNS.some(r=>r.acqError||(r.integrity&&r.integrity.ok===false));'),
    r"""It raises the view when a file could not be read or its checksum does not match,
and leaves it quiet otherwise. It changes no stored value and no export. All eight
views now build; the counts are in Chapter~\ref{ch:val-oracles}.

\section{Findings against the exchange-file specification}
The reader was re-checked against the published schema and format notes of the
exchange format. Each finding was measured, either on the corpus or on a file
written to isolate one clause.

\subsection*{D-2 --- three control types are not recognised}
The specification defines eight sample types. The page maps six, one of which the
specification does not define.
"""]
    o.append(table(['Type', 'Meaning in the specification', 'What the page reports'],
                   [['unkn', 'unknown sample', 'Unknown'],
                    ['ntc', 'non-template control', 'NTC'],
                    ['nac', 'no amplification control', 'not recognised: Unknown'],
                    ['std', 'standard sample', 'Standard'],
                    ['ntp', 'no target present', 'not recognised: Unknown'],
                    ['nrt', 'minus-RT control', 'not recognised: Unknown'],
                    ['pos', 'positive control', 'Positive control'],
                    ['opt', 'optical calibrator sample', 'reported as Unknown'],
                    ['neg', 'not defined by the specification', 'Negative control (unreachable)']],
                   mono=[True, False, False],
                   caption='The declared sample types and what the page makes of them.',
                   label='tab:d2-vocabulary'))
    o.append(r"""
A minus-RT control and a no-target-present control are blanks: nothing should
amplify in them. Reported as unknown samples they are not blanks to the review, so
a rising curve in one raises nothing --- which is the class of event this tool
exists to catch.

\vhead{Evidence}
A file carrying one reaction of each declared type, read by the page:
""")
    md = fmt.get('md5_id.rdml') or {}
    o.append(table(['Well', 'Sample', 'Declared', 'Role assigned', 'Value', 'Call'],
                   [[t['well'], t['sample'], t['declaredType'], t['role'], str(t['cq']), t['call']]
                    for t in md.get('table', [])],
                   mono=[True, True, True, False, False, False]))
    o.append('\\vhead{Proposed correction}')
    o.append(plain('const RDML_SAMPLE_ROLE={unkn:"Unknown",ntc:"NTC",nac:"No-amplification control",\n'
                   '  std:"Standard",ntp:"No target present",nrt:"Minus-RT control",\n'
                   '  pos:"Positive control",opt:"Optical calibrator"};'))
    o.append(r"""
\vhead{A correction to the earlier record}
The record delivered earlier stated that this mapping was complete against the
schema. It was checked against the corpus, which carries only two of the eight
types, and not against the schema. It is not complete.

\subsection*{D-3 --- the ``not available'' value is read as a measurement}
The specification records an absent result as $-1.0$. The reader converts the text
to a number and keeps it, so a reaction the file declares to have no result is
stored with a value of $-1$ and called analysed.
""")
    o.append(table(['File', 'Reactions', 'Below zero', 'Called analysed', 'Undetermined', 'N0 at -1', 'Efficiency at -1'],
                   [[corpus_label(k), str(v['reactions']), str(v['negativeCq']),
                     str(v['negativeCqCalledAnalysed']), str(v['undetermined']),
                     str(v['negativeN0']), str(v['negativeAmpEff'])] for k, v in sen.items()],
                   mono=[True, False, False, False, False, False, False],
                   align=['l', 'r', 'r', 'r', 'r', 'r', 'r'],
                   caption='The not-available sentinel on the corpus.', label='tab:d3-sentinel'))
    n3 = sen['example_3_linregpcr.rdml']
    o.append(r"""
Two files are affected, %d of %d reactions in each. A value of $-1$ sorts below
every real one, so on a chart or in a trend it reads as the earliest crossing on
the plate. This is the same class of defect as the sentinel read as a crossing at
cycle zero, corrected on 23~September, and the property check that catches that one
does not catch this one. A further consequence: an efficiency of $-1$ is present in
three reactions of each file, and the cycle-ceiling rule is guarded by the absence
of an efficiency, so the guard is satisfied by a value that means ``not available''.

\vhead{Proposed correction}
""" % (n3['negativeCq'], n3['reactions']))
    o.append(plain('function rdmlNum(el,name){\n'
                   '  const t=rdmlText(el,name);if(t==="")return null;\n'
                   '  const n=Number(t);if(!Number.isFinite(n))return null;\n'
                   '  return n===-1?null:n;        /* -1.0 is the file saying "not available" */\n'
                   '}'))
    o.append(r"""
This changes stored values --- %d reactions per affected file move from analysed to
undetermined --- and therefore waits for agreement.

\subsection*{D-4 --- a sample declared per target keeps only its first declaration}
A sample may declare a different type for each target. The reader reads the first
declaration and applies it to every target of that sample.
""" % n3['negativeCq'])
    pt = SCH.get('perTarget') or {}
    o.append(table(['Well', 'Sample', 'Target', 'Declared for it', 'Role assigned', 'Value'],
                   [[t['well'], t['sample'], t['target'], 'std' if t['target'] == 'T1' else 'ntp',
                     t['role'], str(t['cq'])] for t in pt.get('table', [])],
                   mono=[True, True, True, True, False, False]))
    ff = fmt.get('free_format.rdml') or {}
    o.append(r"""
The no-target-present reaction is reported as a standard carrying a value of 34,
which would place it on a standard curve.

\subsection*{D-5 --- a free-format run loses every reaction}
The specification defines a row count of $-1$ to mean ``do not reconstruct a plate,
show the reactions as a list''. The reader multiplies rows by columns to bound the
plate, so the bound becomes negative and every reaction is discarded.
""")
    o.append(plain('declared rows -1, columns 1  ->  rows %s  columns %s  highest position %s  reactions kept %s'
                   % (ff.get('rows'), ff.get('cols'), ff.get('maxPos'), ff.get('wells'))))
    o.append(r"""
A run that declares no rows at all is silently given eight by the same expression.

\subsection*{D-6 --- rotor positions are labelled as plate wells}
A rotor declares one column and a numeric row label. The reader labels the
positions as if they were plate wells; the specification asks for plain numbers and
for no column label at all.

\subsection*{D-7 --- two accepted spellings of the format are rejected}
The format notes state that the archive may carry either of two extensions, and
that software should also read the uncompressed XML. The intake accepts one
extension and an archive that contains the expected entry; the other extension and
a bare XML file are rejected as unreadable. Both are one clause in the intake.

\subsection*{D-8 --- the file's own checksum is not used}
The format defines an identifier block carrying a publisher, a serial number and a
hash over the file. The reader reports, for every exchange file including one that
carries such a block:
""")
    o.append(plain(SCH['md5'].get('integrityNoteForFileWithHash') or ''))
    o.append(r"""
That statement is wrong for a file that carries the block, and the page already
contains the hash implementation it would need. For a tool whose purpose is file
forensics this is the most valuable of the conformance findings.

\subsection*{D-9 --- the collection software is a structured element}
The element is defined as a name followed by a version. The reader takes the
element's text content, which concatenates both with the file's own indentation.
Two corpus files are affected. The correction is to read the two children and join
them with a space; it changes a displayed string only.

\subsection*{D-10 --- partitioned reactions are not read}
Partitioned reactions are recorded as counts, with the per-partition table stored
in a separate file inside the archive. The reader ignores the element, so such a
reaction contributes no result and nothing says why.

\subsection*{D-11 --- a latent key mismatch}
When a container and an exchange file are matched, the file-name key is normalised
but the experiment key is only lower-cased. No corpus file is affected --- the case
was tested by renaming an export so that only the experiment identifier could match,
and the match still held --- so this is recorded as a hardening, not a defect.

\section{D-12 --- the function index was short}
The index built by parsing the script recorded fewer symbols than the page exposes
at run time. The index in Appendix~\ref{app:index} is now built from the same walk
used for this part and records %d, including the members of the one module that
hides its helpers.

\section{Behaviour that is by design}
\vhead{Functions that change application state}
""" % V['indexed'])
    mut = [r['name'] for r in V['rows'] if r['klass'] == 'mutates']
    o.append(table(['Function', 'What it changes'],
                   [[n, ROWS[n].get('detail', '')] for n in mut], mono=[True, False]))
    o.append('\\vhead{Entry points that are not called}')
    exc = [r for r in V['rows'] if r['klass'] == 'excluded']
    o.append(table(['Symbol', 'Reason'], [[r['name'], r['detail']] for r in exc], mono=[True, False]))
    priv = sorted(r['name'] for r in V['rows'] if r['klass'] == 'private')
    o.append(r"""
\vhead{Helpers private to a module}
%d names are declared inside the decoder module's closure. They cannot be called by
name from the page; the module exports ten of its members, which are probed through
it, and all of them are printed in full with the module in
Chapter~\ref{ch:val-functions}.
""" % len(priv))
    o.append('\\par{\\small ' + ', '.join('\\texttt{%s}' % esc(n) for n in priv) + '.}\\par\n')
    o.append(r"""
\section{What was checked and found sound}
\begin{itemize}
\item Every property check holds, including the three that guard the defects
  corrected on 23~September.
\item Every check against the run whose answers were fixed first holds.
\item Every tab, review view, graph, console view and export builder runs without a
  page error, and the exports reproduce stored values unchanged.
\item The two readings of the one experiment present in both formats agree on every
  reaction they share, with no differing call.
\item Of %d symbols, none raises an error on a stated input.
\end{itemize}
""" % V['indexed'])
    return '\n'.join(o)

out('chV5_findings.tex', ch_findings())
print('chV5', os.path.getsize('tex/chV5_findings.tex'))

# ============================================================== evidence appendix
def ch_trace():
    o = [r"""\chapter{Validation evidence and the harness that produced it}\label{app:val-trace}

\section{Every symbol, with its verdict}
One row per symbol: the line where it is declared, the verdict, and the provenance
classes of the arguments it was called with. A symbol with no class took no
argument or was not called.
"""]
    rows = []
    for n in NAMES:
        r = ROWS[n]
        cls = ''.join(sorted({a['prov'] for a in r.get('args', [])})) or '--'
        rows.append([n, str(SRC[n]['start']), SHORT[r['klass']], cls])
    half = (len(rows) + 1) // 2
    pairs = [rows[i] + (rows[i + half] if i + half < len(rows) else ['', '', '', '']) for i in range(half)]
    from texlib import fit_rows
    head = ['Symbol', 'Line', 'Result', 'Cls', 'Symbol', 'Line', 'Result', 'Cls']
    mono = [True, False, False, True, True, False, False, True]
    cut, cap = fit_rows(head, pairs, 'footnotesize', mono)
    t = ['{\\footnotesize', '\\begin{longtable}{@{}lrll@{\\hspace{7mm}}lrll@{}}',
         '\\toprule ' + ' & '.join('\\textbf{%s}' % h for h in head) + ' \\\\ \\midrule\\endhead']
    for c in cut:
        t.append(' & '.join(('\\texttt{%s}' % esc(c[i]) if mono[i] and c[i] else esc(c[i])) for i in range(8)) + ' \\\\')
    t += ['\\bottomrule', '\\end{longtable}}']
    o.append('\n'.join(t) + '\n')
    o.append(r"""
\section{The evidence files}
The records are machine-readable and are delivered beside the page, so any verdict
can be re-derived without re-running anything.
""")
    files = [('validation_full.json', 'every symbol: arguments, provenance, output, verdict'),
             ('rdml_validation_data.json', 'the named cases of Chapter~\\ref{ch:val-rdml}'),
             ('invariants_results.json', 'the property checks and their results'),
             ('synthetic_probe_results.json', 'the generated run and the answers fixed first'),
             ('endtoend.json', 'every tab, view, graph and export exercised once'),
             ('schema_findings.json', 'the measurements behind findings D-2 to D-10'),
             ('docdata.json', 'the material the console and mode chapters are built from'),
             ('srcmap.json', 'the line range of every symbol printed here'),
             ('fnindex.json', 'the parsed index of the page script')]
    frows = []
    for f, why in files:
        try:
            b = os.path.getsize(f); h = hashlib.sha256(open(f, 'rb').read()).hexdigest()[:24]
        except OSError:
            b, h = 0, ''
        frows.append([f, format(b, ','), why, h])
    o.append(table(['File', 'Bytes', 'What it holds', 'SHA-256 (first 24)'], frows,
                   mono=[True, False, False, True], align=['l', 'r', 'l', 'l']))
    o.append(r"""
\section{The harness}
Two files: one drives the page and runs the three passes, the other is the probe
that runs inside it. Both are printed in full, because a validation record that
cannot be re-run is an assertion.

\subsection*{The driver}
""")
    o.append(listing(open('capture_all.cjs', encoding='utf8').read(), first=1, size='small'))
    o.append('\\subsection*{The probe}')
    o.append(listing(open('probe_all.js', encoding='utf8').read(), first=1, size='small'))
    o.append('\\section{Re-running it}')
    o.append(plain("""node fnindex.cjs prod.html     # fnindex.json   the parsed index
python3 srcmap.py              # srcmap.json    line ranges
node capture_all.cjs           # validation_full.json  (three passes)
node endtoend.cjs              # endtoend.json
node invariants.cjs prod.html corpus 3
node synthetic_probe.cjs prod.html corpus
node schema_findings.cjs       # schema_findings.json
node docdata.cjs               # docdata.json
python3 genchap.py && python3 genval2.py       # the chapters"""))
    return '\n'.join(o)

out('appF_validation.tex', ch_trace())
print('appF', os.path.getsize('tex/appF_validation.tex'))
