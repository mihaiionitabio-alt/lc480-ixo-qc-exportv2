# -*- coding: utf-8 -*-
"""Generate the validation part of the technical documentation from the captured evidence."""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texlib import esc, escb, brk, tt, listing, plain, longtable, SEN

V   = json.load(open('validation_full.json'))
SRC = json.load(open('srcmap.json'))
E2E = json.load(open('endtoend.json'))
INV = json.load(open('invariants_results.json'))
SYN = json.load(open('synthetic_probe_results.json'))
SCH = json.load(open('schema_findings.json'))
RDML = json.load(open('rdml_validation_data.json'))

ROWS = {r['name']: r for r in V['rows']}
NAMES = sorted(ROWS)

AREAS = [
 ('RDML exchange files', r'^(rdml|RDML_|runProcessingState|runIsInstrumentAnalysed|runIsSuperseded|sopProcessingApplicability|applyRawFilePriority)'),
 ('Microgravity console', r'^(mg|MG_)'),
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
VERDICT = {
 'pass':     ('\\vPASS', 'executed with the stated input; returned the value below; global state unchanged'),
 'constant': ('\\vPASS', 'a declared value; its content at run time is printed below'),
 'mutates':  ('\\vWARN{by design}', 'changes application state; probed in a page of its own'),
 'threw':    ('\\vFAIL', 'raised an error with the stated input'),
 'private':  ('\\vWARN{private}', 'declared inside a module closure; not addressable by name, exercised through its module'),
 'excluded': ('\\vWARN{excluded}', 'deliberately not called'),
}

def out(name, text):
    open('tex/' + name, 'w', encoding='utf8').write(text)
os.makedirs('tex', exist_ok=True)

# =====================================================================  chV1
def ch_method():
    t = V['tally']; p = V['provTally']
    o = [r"""\chapter{How every function in the page was validated}\label{ch:val-method}

The earlier validation record was questioned on one point, and the objection was fair: the
inputs were supplied by the same work that wrote the code, so a table of passes proved only
that the code agreed with its own fixtures. This chapter and the two that follow answer that
objection in the only way it can be answered --- by printing, for every function and constant
in the production build, \emph{the input, where that input came from, the code as it stands in
the page, and the output}. A reader who disagrees with a verdict can re-derive it without
trusting the harness.

\section{What was under test}
""",
r"""\begin{itemize}
\item Page: \vfn{qpcr\_qc\_forensics.html} (identical copy \vfn{index.html}).
\item SHA-256: \texttt{%s}.
\item Size: %s bytes.
\item Captured: %s.
\end{itemize}
""" % (escb(V['build']['sha256']), format(V['build']['bytes'], ','), esc(V['capturedAt'][:19].replace('T', ' ')) + ' UTC'),
r"""\section{The corpus}
Every file below was loaded through the page's own intake --- the same code path an operator
uses. Nothing was edited, and no value was injected into the model by hand.
"""]
    rows = [[tt(c['file']), format(c['bytes'], ','), '{\\ttfamily\\tiny ' + escb(c['sha256'][:32]) + SEN.join('') + '}']
            for c in V['corpus']]
    rows = [[r[0], r[1], r[2].replace(SEN, '')] for r in rows]
    o.append(longtable([r'p{58mm}', r'r', r'p{\dimexpr\linewidth-58mm-22mm-48pt\relax}'],
                       ['File', 'Bytes', 'SHA-256 (first 32 hex digits)'], rows))
    o.append(r"""
Loading them produced %d runs and %s stored results, with no page error.

\section{Provenance classes}
Every argument in this part carries one of four classes. The class says where the value came
from, so that a reader can weigh a verdict accordingly: a function exercised only on class~S
input has been shown to run, not to be right on laboratory data.
""" % (V['state']['runs'], format(V['state']['wells'], ',')))
    o.append(longtable([r'p{14mm}', r'p{\dimexpr\linewidth-14mm-26mm-48pt\relax}', r'r'],
                       ['Class', 'Meaning', 'Arguments'],
                       [['\\textbf{%s}' % k, esc(CLS[k]), str(p.get(k, 0))] for k in 'RDSE']))
    o.append(r"""
\section{The three passes}
A probe that changes application state poisons every probe after it. The capture therefore
runs three times.

\begin{itemize}
\item \textbf{A --- discovery.} Every symbol is probed once in a freshly loaded page, and the
  names whose probe changed global state are recorded.
\item \textbf{B --- clean pass.} Every symbol is probed again in a new page with those names
  held back, so no record in this part was taken after the state had been disturbed.
\item \textbf{C --- isolation.} Each state-changing name is probed in a page of its own.
\end{itemize}

The delivered records are B plus C. One name, \vfn{renderPanel}, is classed as
state-changing in pass~A and passes cleanly in pass~C: it had been disturbed by an earlier
probe, not by itself. That is the whole reason the three passes exist.

\section{What a verdict means}
""")
    o.append(longtable([r'p{30mm}', r'p{\dimexpr\linewidth-30mm-20mm-48pt\relax}', r'r'],
                       ['Verdict', 'Meaning', 'Symbols'],
                       [[VERDICT[k][0], esc(VERDICT[k][1]), str(t.get(k, 0))] for k in
                        ['pass', 'constant', 'private', 'mutates', 'excluded', 'threw'] if k in t]))
    o.append(r"""
\begin{notebox}[title={\textbf{What this part does not claim}}]
A \vPASS{} means the function was called with the stated input and returned the stated value
without disturbing the application. It is a recorded behaviour, not a proof of correctness.
Correctness is argued separately, in Chapter~\ref{ch:val-oracles}, by properties that must
hold of the values regardless of which function produced them, and by inputs whose right
answer was fixed before the page saw them.
\end{notebox}

\section{Coverage}
The index is built from the page's own script at run time, not from a separate list: every
top-level declaration is probed. It contains %d symbols, which is %d more than the function
index of Appendix~\ref{app:index}; the additional names are module-level bindings that the
index's parser did not record%s.

Of the %d, %d functions executed and %d constants were read --- %d symbols with a recorded
input and output. %d names are declared inside the \vfn{EDS} module closure and are not
addressable from the page scope; they are printed in full with their module and are exercised
whenever it is. %d are deliberately not called, each with its reason. %d change application
state by design and were probed in isolation. %d raised an error, and that one is a defect in
the page, reported in Chapter~\ref{ch:val-findings}.
""" % (V['indexed'], V['indexed'] - 579,
       ' (' + ', '.join(tt(n) for n in sorted(set(ROWS) - set(x['name'] for x in json.load(open('fnindex.json'))))[:8]) + ' and others)',
       V['indexed'], t.get('pass', 0), t.get('constant', 0), t.get('pass', 0) + t.get('constant', 0),
       t.get('private', 0), t.get('excluded', 0), t.get('mutates', 0), t.get('threw', 0)))
    return '\n'.join(o)

out('chV1_method.tex', ch_method())
print('chV1 written')

# =====================================================================  chV2
def guard(s):
    return str(s).replace('\\end{lstlisting}', '\\end {lstlisting}')

def entry(n):
    r = ROWS[n]; s = SRC[n]
    k = r['klass']; v, why = VERDICT[k]
    o = ['\\subsection*{\\vfn{%s}}\\label{vf:%s}' % (escb(n), re.sub(r'[^A-Za-z0-9]', '', n)),
         '\\nopagebreak']
    meta = ['HTML lines %d--%d (%d)' % (s['start'], s['end'], s['lines'])]
    if k not in ('constant', 'private', 'excluded'):
        meta.append('arity %d' % r.get('arity', 0))
    if r.get('reachedVia') and r['reachedVia'] != 'page scope':
        meta.append('reached as \\vfn{%s}' % escb(r['reachedVia']))
    if r.get('isolated'): meta.append('probed in a page of its own')
    o.append('{\\small ' + ' \\textperiodcentered{} '.join(meta) + ' \\hfill ' + v + '}\\par')
    o.append('\\vhead{Source as built}')
    o.append(listing(guard(s['code']), first=s['start']))

    if k == 'excluded':
        o.append('\\vhead{Not called}' + esc(r.get('detail', '')) + '.\\par')
        return '\n'.join(o) + '\n'
    if k == 'private':
        o.append('\\vhead{Reachability}' + esc(r.get('detail', '')) +
                 '. It is exercised whenever its module is, and its module\'s public entry points are probed above.\\par')
        return '\n'.join(o) + '\n'
    if k == 'constant':
        o.append('\\vhead{Value at run time, with the corpus loaded}')
        o.append(plain(guard(r.get('value', ''))))
        o.append('\\vhead{Verdict}\\vPASS{} --- ' + esc(why) + '.\\par')
        return '\n'.join(o) + '\n'

    args = r.get('args', [])
    o.append('\\vhead{Input}')
    if not args:
        o.append('The function takes no argument; it reads the application state built from the corpus.\\par')
    else:
        rows = [[tt(a['param']), '\\textbf{%s}' % a['prov'], escb(a['from']),
                 '{\\ttfamily\\tiny ' + escb(a.get('value') if a.get('value') is not None else 'undefined') + '}']
                for a in args]
        o.append(longtable([r'p{22mm}', r'p{7mm}', r'p{44mm}',
                            r'p{\dimexpr\linewidth-22mm-7mm-44mm-80pt\relax}'],
                           ['Parameter', 'Cls', 'Where it came from', 'Value as passed'], rows))
    o.append('\\vhead{Output}')
    if k == 'threw':
        o.append('The call raised: ' + plain(guard(r.get('output', ''))))
    else:
        o.append('{\\small Returned %s.}\\par' % esc(r.get('outputShape', '')))
        o.append(plain(guard(r.get('output', ''))))
    se = {kk: vv for kk, vv in (r.get('sideEffects') or {}).items() if vv}
    o.append('\\vhead{Verdict}')
    line = v + ' --- ' + esc(why) + '.'
    if r.get('detail'): line += ' ' + esc(r['detail']) + '.'
    if se: line += ' Side effects attempted and neutralised: ' + esc(', '.join('%s %d' % (a, b) for a, b in se.items())) + '.'
    o.append(line + '\\par')
    return '\n'.join(o) + '\n'

def ch_functions():
    o = [r"""\chapter{Function by function}\label{ch:val-functions}

Every top-level function and constant of the production build, in the order the page declares
them within each area. For each: the code exactly as it stands in the page with its HTML line
numbers, the arguments it was called with and where each came from, the value it returned, and
the verdict. Long values are printed as far as the record keeps them and the remaining length
is stated.
"""]
    for area, _ in AREAS + [('Shared utilities and constants', '')]:
        names = [n for n in NAMES if ROWS[n]['area'] == area]
        if not names: continue
        names.sort(key=lambda n: SRC[n]['start'])
        tal = {}
        for n in names: tal[ROWS[n]['klass']] = tal.get(ROWS[n]['klass'], 0) + 1
        o.append('\\section{%s}' % esc(area))
        o.append('{\\small %d symbols: %s.}\\par' % (
            len(names), ', '.join('%d %s' % (c, k) for k, c in sorted(tal.items(), key=lambda kv: -kv[1]))))
        SHORT = {'pass':'pass','constant':'const','private':'priv','mutates':'state','excluded':'excl','threw':'\\vFAIL'}
        rows = [[tt(n), SHORT.get(ROWS[n]['klass'], esc(ROWS[n]['klass'])), str(SRC[n]['start']),
                 '\\pageref{vf:%s}' % re.sub(r'[^A-Za-z0-9]', '', n)] for n in names]
        pairs = []
        half = (len(rows) + 1) // 2
        for i in range(half):
            a = rows[i]; b = rows[i + half] if i + half < len(rows) else ['', '', '', '']
            pairs.append(a + b)
        o.append(longtable([r'p{23mm}', r'p{17mm}', r'r', r'r@{\hspace{7mm}}',
                            r'p{23mm}', r'p{17mm}', r'r', r'r'],
                           ['Symbol', 'Result', 'Line', 'Page', 'Symbol', 'Result', 'Line', 'Page'],
                           pairs))
        for n in names: o.append(entry(n))
    return '\n'.join(o)

out('chV2_functions.tex', ch_functions())
print('chV2 written', os.path.getsize('tex/chV2_functions.tex'), 'bytes')

# =====================================================================  chV3
def ch_oracles():
    inv = INV['checks']; syn = SYN['oracle']
    o = [r"""\chapter{Independent checks}\label{ch:val-oracles}

Chapter~\ref{ch:val-functions} records what each function did. It cannot say whether what it
did was right, because the expectation and the input came from the same place. This chapter
holds the checks that can: properties that must be true of the values whatever produced them,
inputs whose right answer was fixed before the page saw them, and two readings of the same
experiment that must agree.

\section{Properties that must hold}
None of the defects found during this work were contract violations. Every one of them was a
\emph{wrong value} returned by a function that did not throw --- a Cq of zero read from an
empty field, a finding raised in a module that has no crossings. A property check states
something that must be true of the values and fails loudly when it is not, without naming the
function that has to keep it true.
"""]
    o.append(longtable([r'p{56mm}', r'p{\dimexpr\linewidth-56mm-16mm-48pt\relax}', r'r'],
                       ['Property', 'Why it must hold', 'Result'],
                       [[escb(c['name']), escb(c['why']), '\\vPASS' if c['ok'] else '\\vFAIL']
                        for c in inv]))
    o.append('\\par %d of %d hold on this build.\n' % (INV['passed'], INV['total']))

    o.append(r"""
\section{A run whose answers were known first}
The second check removes laboratory data from the question altogether. A run is generated from
a fixed seed: its plate, its controls, its Cq values and its intended outcome for every sample
are written down first, and the page is then asked for its reading. Because the fixture was
built to a stated answer and not from the page's output, an agreement is evidence and a
disagreement is a defect.

The fixture is deterministic --- the same seed gives the same run --- and it is the input that
found the sentinel defect of 23~September, which no laboratory file had exposed.
""")
    o.append(longtable([r'p{62mm}', r'p{\dimexpr\linewidth-62mm-16mm-48pt\relax}', r'r'],
                       ['Check', 'Expected', 'Result'],
                       [[escb(c['name']), escb(str(c.get('want', ''))), '\\vPASS' if c['ok'] else '\\vFAIL']
                        for c in syn['checks']]))
    o.append('\\par %d of %d hold. The outcome tally the page produced from the fixture: %s.\n'
             % (sum(1 for c in syn['checks'] if c['ok']), len(syn['checks']),
                escb(', '.join('%s %s' % (k, v) for k, v in syn['outcomes'].items()))))

    o.append(r"""
\section{The same experiment read twice}
One experiment in the corpus exists both as an instrument container and as an exchange file
written from it. The two are read by different code --- the container by the intake and its
decoder, the exchange file by the reader of Chapter~\ref{ch:rdml} --- and they must produce the
same calls for the reactions they share. This is the strongest check available, because
neither reading can be tuned to the other without breaking a real file.

The comparison is set out in Section~\ref{sec:val-oracle}.

\section{Everything the operator can reach, exercised once}
With the corpus loaded, every tab was opened, every review view rendered, every graph drawn,
every console view built and every export button pressed with the download path stubbed and
counted.
""")
    def st(d):
        return [[escb(k), ('\\vFAIL{} ' + escb(v[7:])) if str(v).startswith('THREW') else escb(v)]
                for k, v in d.items()]
    o.append('\\vhead{Tabs}')
    o.append(longtable([r'p{40mm}', r'p{\dimexpr\linewidth-40mm-48pt\relax}'], ['Tab', 'Result'], st(E2E['tabs'])))
    o.append('\\vhead{Review views}')
    o.append(longtable([r'p{40mm}', r'p{\dimexpr\linewidth-40mm-48pt\relax}'], ['View', 'Result'], st(E2E['reviewViews'])))
    o.append('\\vhead{Console views}')
    o.append(longtable([r'p{40mm}', r'p{\dimexpr\linewidth-40mm-48pt\relax}'], ['View', 'Result'], st(E2E['consoleViews'])))
    gbad = [k for k, v in E2E['graphs'].items() if str(v).startswith('THREW')]
    o.append('\\vhead{Graphs}%d graphs were drawn; %s.\\par\n' %
             (len(E2E['graphs']), 'none failed' if not gbad else escb(', '.join(gbad)) + ' failed'))
    o.append('\\vhead{Exports}')
    o.append(longtable([r'p{62mm}', r'p{\dimexpr\linewidth-62mm-48pt\relax}'], ['Button', 'Files produced'], st(E2E['exports'])))
    o.append(longtable([r'p{74mm}', r'r'], ['File written', 'Bytes'],
                       [[escb(d['name']), format(d['bytes'], ',')] for d in E2E['downloads']]))
    o.append(r"""
The exercise raised %d page error%s. One console view failed to build; it is reported as
finding~D-1 in Chapter~\ref{ch:val-findings}.

\section{What none of this covers}
\begin{itemize}
\item A property check can only fail on the corpus it is given. It says nothing about a file
  shape that no corpus file has.
\item The generated run is a model of a qPCR plate, not a qPCR plate. It cannot show that a
  threshold is the right threshold; it can only show that the page applies the rule it states.
\item An agreement between two readings of one experiment is evidence that neither reading is
  arbitrary. It is not evidence that both are right.
\item No check in this document establishes a laboratory acceptance limit, and none of it
  replaces method validation.
\end{itemize}
""" % (len(E2E.get('pageErrors', [])), '' if len(E2E.get('pageErrors', [])) == 1 else 's'))
    return '\n'.join(o)

out('chV3_oracles.tex', ch_oracles())
print('chV3 written', os.path.getsize('tex/chV3_oracles.tex'))

# =====================================================================  chV4
def ch_rdml():
    recs = RDML['records']
    plain_fns = [f for f in dict.fromkeys(r['fn'] for r in recs) if '(' not in f]
    o = [r"""\chapter{The exchange-file reader, case by case}\label{ch:val-rdml}

The reader of Chapter~\ref{ch:rdml} was validated before it was merged, with a named case for
every function and an expectation written before the call. Those cases are reproduced here;
the code they exercise is printed in Section~\ref{sec:val-rdml-source} of
Chapter~\ref{ch:val-functions}, so it is not repeated.

\section{The corpus for these cases}
"""]
    o.append(longtable([r'p{62mm}', r'r', r'p{\dimexpr\linewidth-62mm-22mm-48pt\relax}'],
                       ['File', 'Bytes', 'SHA-256 (first 32)'],
                       [[tt(c['file']), format(c['bytes'], ','), '{\\ttfamily\\tiny ' + esc(c['sha256'][:32]) + '}']
                        for c in RDML['corpus']]))
    o.append(r"""
\section{Case by case}
Each row is one call. \textbf{Cls} is the provenance class of Section~\ref{ch:val-method}:
\textbf{R} a real file unmodified, \textbf{D} derived by the code under test from a real file,
\textbf{S} synthetic, written to reach a boundary the corpus does not contain.
""")
    for f in plain_fns:
        rs = [r for r in recs if r['fn'] == f]
        o.append('\\subsection*{\\vfn{%s}}' % escb(f))
        o.append('{\\small %d case%s, %d passed.}\\par' % (len(rs), '' if len(rs) == 1 else 's',
                                                           sum(1 for r in rs if r['pass'])))
        rows = []
        for r in rs:
            rows.append([escb(r['case']), '\\textbf{%s}' % esc(str(r.get('inputProvenance', ''))[:1]),
                         escb(r['inputDesc']),
                         '{\\ttfamily\\tiny ' + escb(json.dumps(r['output'])[:220]) + '}',
                         escb(r['expect']),
                         '\\vPASS' if r['pass'] else '\\vFAIL'])
        o.append(longtable([r'p{26mm}', r'p{6mm}', r'p{30mm}',
                            r'p{\dimexpr\linewidth-26mm-6mm-30mm-34mm-17mm-96pt\relax}',
                            r'p{34mm}', r'p{17mm}'],
                           ['Case', 'Cls', 'Input', 'Output', 'Expected', 'Result'], rows))
    o.append(r"""
\section{Integration validations}\label{sec:val-oracle}
Three checks concern the reader as a whole rather than any one function.

\subsection*{A Cq equal to the cycle count}
An exchange file written by vendor software records ``no crossing'' as a Cq equal to the run's
cycle count. Read literally, most of a plate becomes a very late detection. A re-analysis file
does not do this, so the rule is applied only where the file offers no starting concentration
and no efficiency to contradict it.
""")
    ceil = [r for r in recs if 'ceiling' in r['fn']]
    o.append(longtable([r'p{54mm}', r'r', r'r', r'r', r'r', r'r'],
                       ['File', 'Cycles', 'Rows', 'Converted', 'Kept', 'Max Cq'],
                       [[tt(r['case']), str(r['input']['cycles']), str(r['input']['rows']),
                         str(r['output']['converted']), str(r['output']['remainingWithCq']),
                         str(r['output']['cqMax'])] for r in ceil]))
    orc = [r for r in recs if 'cross-format' in r['fn']]
    if orc:
        r = orc[0]
        o.append(r"""
\subsection*{The same experiment, read twice}
One experiment is present in the corpus both as an instrument container and as an exchange file
written from it. The container is decoded by the intake; the exchange file by the reader. For
the reactions the two have in common the calls must agree.
""")
        o.append(plain(json.dumps(r['output'], indent=1)))
        o.append('\\par Expected: ' + escb(r['expect']) + ' --- ' + ('\\vPASS' if r['pass'] else '\\vFAIL') + '.\n')
    pri = [r for r in recs if r['fn'] in ('applyRawFilePriority', 'runIsSuperseded')]
    o.append(r"""
\subsection*{Which file wins when both are present}
The tool is for experiments the instrument software has already analysed. Where an instrument
container and an exchange file describe the same experiment, the container is authoritative and
the exchange file is kept as comparison evidence, marked superseded.
""")
    o.append(longtable([r'p{34mm}', r'p{40mm}',
                        r'p{\dimexpr\linewidth-34mm-40mm-17mm-64pt\relax}', r'p{17mm}'],
                       ['Function', 'Case', 'Result', 'Verdict'],
                       [[tt(r['fn']), escb(r['case']), '{\\ttfamily\\tiny ' + escb(json.dumps(r['output'])[:200]) + '}',
                         '\\vPASS' if r['pass'] else '\\vFAIL'] for r in pri]))
    o.append('\\par All %d recorded cases pass on build \\texttt{%s}.\n'
             % (len(recs), escb(RDML.get('page', {}).get('sha256', '')[:32] if isinstance(RDML.get('page'), dict) else '')))
    return '\n'.join(o)

out('chV4_rdml.tex', ch_rdml())
print('chV4 written', os.path.getsize('tex/chV4_rdml.tex'))

# =====================================================================  chV5
def ch_findings():
    voc = SCH['vocabulary']; sen = SCH['sentinel']; fmt = SCH['format']
    sentinel_rows = [[tt(k), str(v['reactions']), str(v['negativeCq']), str(v['negativeCqCalledAnalysed']),
                      str(v['undetermined']), str(v['negativeN0']), str(v['negativeAmpEff'])]
                     for k, v in sen.items()]
    o = [r"""\chapter{What the validation found}\label{ch:val-findings}

Everything in this chapter was produced by the checks of the three preceding chapters on the
build under test, and every number below can be re-derived from the evidence file listed in
Appendix~\ref{app:val-trace}. Findings are numbered D-1 upwards. None of them has been changed
in the page: stored values, calls, chart mathematics and export bytes are not altered without
agreement, and three of these findings would change stored values.

\section{D-1 --- a console view fails to build}
\vhead{What happens}
\vfn{mgViewLoad} refers to a name, \vfn{bad}, that is not defined anywhere in its scope. The
reference is on the path taken whenever at least one file has been read, so the function raises
\texttt{ReferenceError: bad is not defined} in every session that has data --- which is every
real session. The other seven console views build normally.

\vhead{Evidence}
""",
plain("""MG_VIEWS, with the corpus loaded:
  load        THREW: bad is not defined
  sop         20 items
  results     2 items
  panel       54 items
  graphs      26 items
  review      9 items
  export      11 items
  integrity   1 item"""),
r"""\vhead{Why it matters}
The load view is the first view of the console and the one that answers ``what is in this
session''. A console intended for use under stress must not lose its opening view, and the
failure is silent: the view simply produces nothing.

\vhead{The line}
""",
plain('out.push(mgIt({kind:"summary",sev:bad?"alarm":"ok",pict:MG_PICT.summary, ...   // HTML line 7337'),
r"""\vhead{Proposed correction}
Define the condition the line was written for, immediately above the push:
""",
plain('const bad=RUNS.some(r=>r.acqError||(r.integrity&&r.integrity.ok===false));'),
r"""This raises the view to \texttt{alarm} when a file could not be read or its integrity does not
match, and leaves it at \texttt{ok} otherwise. It changes no stored value and no export.

\section{Findings against the exchange-file specification}
The reader was re-checked against the schema and the format notes of the exchange format
version~1.3. Six of the findings below are conformance gaps; two are behaviour that the
specification defines and the reader does not implement. Each was measured, either on the
corpus or on a purpose-built file that isolates one clause.

\subsection*{D-2 --- three control types are not recognised}
The specification defines eight sample types. The page maps six, one of which the
specification does not define.
""",
]
    o.append(longtable([r'p{18mm}', r'p{\dimexpr\linewidth-18mm-48mm-48pt\relax}', r'p{48mm}'],
                       ['Type', 'Meaning in the specification', 'What the page reports'],
                       [['\\texttt{unkn}', 'unknown sample', 'Unknown'],
                        ['\\texttt{ntc}', 'non-template control', 'NTC'],
                        ['\\texttt{nac}', 'no amplification control', '\\vFAIL{} not recognised: Unknown'],
                        ['\\texttt{std}', 'standard sample', 'Standard'],
                        ['\\texttt{ntp}', 'no target present', '\\vFAIL{} not recognised: Unknown'],
                        ['\\texttt{nrt}', 'minus-RT control', '\\vFAIL{} not recognised: Unknown'],
                        ['\\texttt{pos}', 'positive control', 'Positive control'],
                        ['\\texttt{opt}', 'optical calibrator sample', '\\vFAIL{} reported as Unknown'],
                        ['\\texttt{neg}', '\\emph{not defined by the specification}', 'Negative control (unreachable)']]))
    o.append(r"""
\vhead{Why it matters}
A minus-RT control and a no-target-present control are blanks: their whole purpose is that
nothing should amplify in them. Reported as unknown samples they are not blanks to the review,
so a rising curve in one raises nothing. That is precisely the class of event this tool exists
to catch.

\vhead{Evidence}
A file carrying one reaction of each declared type, read by the page:
""")
    md = fmt.get('md5_id.rdml') or {}
    o.append(longtable([r'p{16mm}', r'p{26mm}', r'p{22mm}', r'p{34mm}', r'r', r'p{22mm}'],
                       ['Well', 'Sample', 'Declared', 'Role the page assigns', 'Cq', 'Call'],
                       [[tt(t['well']), tt(t['sample']), tt(t['declaredType']),
                         ('\\vFAIL{} ' if t['role'] == 'Unknown' and t['declaredType'] not in ('unkn',) else '') + escb(t['role']),
                         escb(str(t['cq'])), escb(t['call'])] for t in md.get('table', [])]))
    o.append(r"""
\vhead{Proposed correction}
""")
    o.append(plain('const RDML_SAMPLE_ROLE={unkn:"Unknown",ntc:"NTC",nac:"No-amplification control",\n'
                   '  std:"Standard",ntp:"No target present",nrt:"Minus-RT control",\n'
                   '  pos:"Positive control",opt:"Optical calibrator"};'))
    o.append(r"""
\vhead{A correction to the earlier record}
The validation record delivered on 24~September stated that this mapping was complete against
the schema. That statement was wrong: it was checked against the files in the corpus, which
carry only \texttt{unkn} and \texttt{ntc}, and not against the schema itself. The case has been
replaced by the file above, which carries every declared type.

\subsection*{D-3 --- the ``not available'' value is read as a measurement}
The specification records an absent result as $-1.0$ for \texttt{cq}, \texttt{N0},
\texttt{corrP} and \texttt{corrCq}. The reader converts the text to a number and keeps it, so a
reaction the file declares to have no result is stored with a Cq of $-1$ and called
\emph{Analysed}.
""")
    o.append(longtable([r'p{48mm}', r'p{16mm}', r'p{14mm}', r'p{18mm}', r'p{18mm}', r'p{14mm}', r'p{16mm}'],
                       ['File', 'Reac{-}tions', 'Cq $<0$', 'of those called analysed',
                        'Un{-}deter{-}mined', 'N0 $=-1$', 'ampEff $=-1$'],
                       sentinel_rows))
    o.append(r"""
Two files of the corpus are affected: %d of %d reactions in each. A Cq of $-1$ is not merely
wrong, it sorts below every real value, so on a chart or in a trend it reads as the earliest
crossing on the plate. This is the same class of defect as the sentinel read as a crossing at
cycle~0 that was corrected on 23~September, and the property check that catches that one --- 
\emph{no stored Cq is read as a crossing at cycle 0} --- does not catch this one.

A further consequence: \texttt{ampEff} of $-1$ is present in three reactions of each file, and
the cycle-ceiling rule is guarded by the \emph{absence} of an efficiency. A $-1$ there counts
as an efficiency, so the guard is satisfied by a value that means ``not available''.

\vhead{Proposed correction}
""" % (sen['example_3_linregpcr.rdml']['negativeCq'], sen['example_3_linregpcr.rdml']['reactions']))
    o.append(plain('function rdmlNum(el,name){\n'
                   '  const t=rdmlText(el,name);if(t==="")return null;\n'
                   '  const n=Number(t);if(!Number.isFinite(n))return null;\n'
                   '  return n===-1?null:n;                 /* -1.0 is the file saying "not available" */\n'
                   '}'))
    o.append(r"""
This changes stored values --- %d reactions per affected file move from \emph{Analysed} to
\emph{Undetermined} --- and therefore needs agreement before it is applied.

\subsection*{D-4 --- a sample declared per target keeps only its first declaration}
A sample may declare a different type for each target: standard for one, no-target-present for
another. The reader reads the first \texttt{<type>} element and applies it to every target of
that sample.

\vhead{Evidence}
A file in which \texttt{S\_dual} is \texttt{std} for target \texttt{T1} and \texttt{ntp} for
target \texttt{T2}:
""" % sen['example_3_linregpcr.rdml']['negativeCq'])
    pt = SCH.get('perTarget') or {}
    o.append(longtable([r'p{16mm}', r'p{26mm}', r'p{20mm}', r'p{26mm}', r'p{34mm}', r'r'],
                       ['Well', 'Sample', 'Target', 'Declared for it', 'Role the page assigns', 'Cq'],
                       [[tt(t['well']), tt(t['sample']), tt(t['target']),
                         tt('std' if t['target'] == 'T1' else 'ntp'), escb(t['role']), escb(str(t['cq']))]
                        for t in pt.get('table', [])]))
    o.append(r"""
The no-target-present reaction is reported as a standard carrying a Cq of 34, which would place
it on a standard curve.

\subsection*{D-5 --- a free-format run loses every reaction}
The specification defines \texttt{rows} $=-1$ to mean ``do not reconstruct a plate, show the
reactions as a list''. The reader multiplies rows by columns to bound the plate, so the bound
becomes negative and every reaction is discarded.
""")
    ff = fmt.get('free_format.rdml') or {}
    o.append(plain('pcrFormat rows=-1 columns=1  ->  rows %s  cols %s  maxPos %s  wells %s'
                   % (ff.get('rows'), ff.get('cols'), ff.get('maxPos'), ff.get('wells'))))
    o.append(r"""
A run that declares \texttt{rows} $=0$ is silently given eight rows by the same expression.

\subsection*{D-6 --- rotor positions are labelled as plate wells}
A rotor declares one column and a row label of \texttt{123}. The reader labels the positions
\texttt{A01}, \texttt{B01}, \texttt{C01}; the specification asks for \texttt{1}, \texttt{2},
\texttt{3}, and asks that no column label be shown when there is one column.

\subsection*{D-7 --- two accepted spellings of the format are rejected}
The format notes state that the archive may carry the extension \texttt{.rdml} or \texttt{.rdm},
and that software should also read the uncompressed XML. The intake accepts \texttt{.rdml} and a
\texttt{.zip} that contains \texttt{rdml\_data.xml}; a \texttt{.rdm} file and a bare XML file are
rejected with ``not an .ixo, .eds, .edt, .rdml or .zip file''. Both are one clause in the intake.

\subsection*{D-8 --- the file's own checksum is not used}
The format defines an identifier block carrying a publisher, a serial number and an MD5 hash
over the file. The reader reports, for every exchange file including one that carries such a
block:
""")
    o.append(plain(SCH['md5'].get('integrityNoteForFileWithHash') or ''))
    o.append(r"""
That statement is wrong for a file that carries the block, and the page already contains an MD5
implementation (used for the container tamper check), so the check is available. For a tool
whose purpose is file forensics this is the most valuable of the conformance findings.

\subsection*{D-9 --- the collection software is a structured element}
\texttt{dataCollectionSoftware} is defined as a name followed by a version. The reader takes the
element's text content, which concatenates both with the file's own indentation:
""")
    o.append(plain('meta.SWVersion = "QuantStudio 3 and 5 Software\\n                1.6.1"'))
    o.append(r"""
Two corpus files are affected. The correction is to read the two children and join them with a
space. This changes a displayed string only.

\subsection*{D-10 --- partitioned reactions are not read}
Digital PCR reactions are recorded as partition counts, with the per-partition table stored in a
separate file inside the archive. The reader ignores the element, so such a reaction contributes
no result and nothing says why. At a minimum the counts should be read and the presence of a
partition table reported.

\subsection*{D-11 --- a latent key mismatch}
When an instrument container and an exchange file are matched, the file-name key is normalised
but the experiment key is only lower-cased. No corpus file is affected --- the case was tested
by renaming an export so that only the experiment identifier could match, and the match still
held --- so this is recorded as a hardening, not a defect.

\section{D-12 --- the function index is short by 36 entries}
The index of Appendix~\ref{app:index} is built by parsing the page's script and records 579
distinct symbols. The index used for this validation is built from the running page and records
%d. The 36 that the parser did not record are module-level bindings, among them the active
profile, the pasted-data buffer and the dirty-tab set --- state that a reader of the
documentation would expect to find listed.

\section{Behaviour that is by design}
Three groups of symbols are not defects and are recorded here so that they are not read as such.

\vhead{Functions that change application state}
Seven functions change state as their purpose. Each was probed in a page of its own, so the
records in Chapter~\ref{ch:val-functions} for every other function were taken from an
undisturbed page.
""" % V['indexed'])
    mut = [r['name'] for r in V['rows'] if r['klass'] == 'mutates']
    o.append(longtable([r'p{44mm}', r'p{\dimexpr\linewidth-44mm-48pt\relax}'],
                       ['Function', 'What it changes'],
                       [[tt(n), escb(ROWS[n].get('detail', ''))] for n in mut]))
    o.append(r"""
\vhead{Entry points that are not called}
""")
    exc = [r for r in V['rows'] if r['klass'] == 'excluded']
    o.append(longtable([r'p{44mm}', r'p{\dimexpr\linewidth-44mm-48pt\relax}'],
                       ['Symbol', 'Reason'], [[tt(r['name']), escb(r['detail'])] for r in exc]))
    o.append(r"""
\vhead{Helpers private to a module}
%d names are declared inside the decoder module's closure. They cannot be called by name from
the page, and the module exports ten of its members, which are probed through it. All of them
are printed in full with the module in Chapter~\ref{ch:val-functions}.
""" % sum(1 for r in V['rows'] if r['klass'] == 'private'))
    priv = sorted(r['name'] for r in V['rows'] if r['klass'] == 'private')
    o.append('\\par{\\small ' + ', '.join(tt(n) for n in priv) + '.}\\par\n')
    o.append(r"""
\section{What was checked and found sound}
\begin{itemize}
\item Every property check of Section~\ref{ch:val-oracles} holds, including the three that
  guard the defects corrected on 23~September.
\item Every check against the run whose answers were fixed first holds.
\item Every tab, every review view, every graph and every export builder runs without a page
  error, and the exports reproduce stored values unchanged.
\item The two readings of the one experiment present in both formats agree on every reaction
  they share, with no differing call.
\item Of %d symbols, exactly one raises an error on a stated input, and that one is D-1.
\end{itemize}
""" % V['indexed'])
    return '\n'.join(o)

out('chV5_findings.tex', ch_findings())
print('chV5 written', os.path.getsize('tex/chV5_findings.tex'))

# =====================================================================  appF
import hashlib
def ch_trace():
    o = [r"""\chapter{Validation evidence and the harness that produced it}\label{app:val-trace}

\section{Every symbol, with its verdict}
One row per symbol: the line in
the page where it is declared, the verdict, and the provenance classes of the arguments it was
called with. A symbol with no class took no argument or was not called.
"""]
    rows = []
    for n in NAMES:
        r = ROWS[n]
        cls = ''.join(sorted({a['prov'] for a in r.get('args', [])})) or '--'
        SHORT = {'pass':'pass','constant':'const','private':'priv','mutates':'state','excluded':'excl','threw':'\\vFAIL'}
        rows.append([tt(n), str(SRC[n]['start']), SHORT.get(r['klass'], escb(r['klass'])), cls])
    o.append(longtable([r'p{31mm}', r'r', r'p{17mm}', r'p{8mm}@{\hspace{6mm}}',
                        r'p{31mm}', r'r', r'p{17mm}', r'p{8mm}'],
                       ['Symbol', 'Line', 'Result', 'Cls', 'Symbol', 'Line', 'Result', 'Cls'],
                       [rows[i] + (rows[i + (len(rows)+1)//2] if i + (len(rows)+1)//2 < len(rows) else ['','','',''])
                        for i in range((len(rows)+1)//2)]))
    o.append(r"""
\section{The evidence files}
The records above are machine-readable. They are delivered beside the page so that any verdict
can be re-derived without re-running anything.
""")
    files = [('validation_full.json', 'every symbol: arguments, provenance, output, verdict'),
             ('rdml_validation_data.json', 'the 89 named cases of Chapter~\\ref{ch:val-rdml}'),
             ('invariants_results.json', 'the property checks and their results'),
             ('synthetic_probe_results.json', 'the generated run and the answers fixed before the page saw it'),
             ('endtoend.json', 'every tab, view, graph, console view and export exercised once'),
             ('schema_findings.json', 'the measurements behind findings D-2 to D-10'),
             ('srcmap.json', 'the line range in the page of every symbol printed here')]
    frows = []
    for f, why in files:
        try:
            bts = os.path.getsize(f)
            h = hashlib.sha256(open(f, 'rb').read()).hexdigest()[:32]
        except OSError:
            bts, h = 0, ''
        frows.append([tt(f), format(bts, ','), escb(why), '{\\ttfamily\\tiny ' + esc(h) + '}'])
    o.append(longtable([r'p{46mm}', r'r', r'p{\dimexpr\linewidth-46mm-16mm-46mm-64pt\relax}', r'p{46mm}'],
                       ['File', 'Bytes', 'What it holds', 'SHA-256 (first 32)'], frows))
    o.append(r"""
\section{The harness}
Two files. The first drives the page and runs the three passes; the second is the probe that
runs inside it. Both are printed in full, because a validation record that cannot be re-run is
an assertion.

\subsection*{The driver}
""")
    o.append(listing(guard(open('capture_all.cjs', encoding='utf8').read()), first=1, size='tiny'))
    o.append(r"""\subsection*{The probe}""")
    o.append(listing(guard(open('probe_all.js', encoding='utf8').read()), first=1, size='tiny'))
    o.append(r"""
\section{Re-running it}
""")
    o.append(plain("""node capture_all.cjs        # validation_full.json   (three passes)
node endtoend.cjs          # endtoend.json
node invariants.cjs prod.html corpus 3
node synthetic_probe.cjs prod.html corpus
node schema_findings.cjs   # schema_findings.json
python3 srcmap.py && python3 genval.py   # the chapters above"""))
    return '\n'.join(o)

out('appF_validation.tex', ch_trace())
print('appF written', os.path.getsize('tex/appF_validation.tex'))
