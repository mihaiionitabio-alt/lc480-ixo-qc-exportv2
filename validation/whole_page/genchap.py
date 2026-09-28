# -*- coding: utf-8 -*-
"""The three chapters that describe the console, the two operator modes and the
structure the code follows."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texlib import esc, neutral, jitter, table, listing, plain, tt

D = json.load(open('docdata.json'))
V = json.load(open('validation_full.json'))
SRC = json.load(open('srcmap.json'))
os.makedirs('tex', exist_ok=True)
def out(n, t): open('tex/' + n, 'w', encoding='utf8').write(t)
def src(name, size='small'):
    s = SRC.get(name)
    if not s: return ''
    return listing(s['code'], first=s['start'], size=size)

# ============================================================ console
def ch_console():
    views = D['consoleViews']
    o = [r"""\chapter{The console}\label{ch:console}

The page has a second face. The tabs are made for a desk: a mouse, a large
window, time to read. The console is made for the other case --- a small screen,
gloves, noise, a person who has to decide now. It is opened from the status bar
and it covers the page completely, because a half-covered page is a page that can
be misread.

Two rules shaped it. The first is that the console must never be a dead end: a
view that has nothing to report still says what it has, because an operator under
pressure reads ``nothing outstanding'' as ``the tool has stopped working''. The
second is that the console carries the same data as the page, not a summary of it:
every figure in it comes from the same function the tab calls.

\section{What the console shows}
Eight views, one per area of the page. Each view builds its own items from the
loaded data; none of them filters a shared list, which is why two views never show
the same thing twice. The counts below are from the corpus used throughout this
part.
"""]
    rows = [[v['view'], str(v['n']),
             ', '.join('%s %d' % (k, n) for k, n in sorted(v['kinds'].items(), key=lambda kv: -kv[1])),
             ', '.join('%s %d' % (k, n) for k, n in sorted(v['sev'].items(), key=lambda kv: -kv[1]))]
            for v in views]
    o.append(table(['View', 'Items', 'Kinds of item', 'Severity'], rows,
                   mono=[True, False, False, False],
                   caption='The eight console views and what each built from the corpus.',
                   label='tab:console-views'))
    o.append(r"""
\section{An item}
An item is one fact with everything needed to act on it: a code, a title, a value
with its unit, the limits it was judged against, a sentence of state, the evidence
behind it, a small table of detail and the actions that can follow. The item below
is the first one the load view builds.
""")
    s = views[0]['sample']
    meta = [['code', s['code']], ['title', neutral(s['title'])], ['value', s['value'] + ' ' + s['unit']],
            ['kind', s['kindWord']], ['state', neutral(s['state'])]]
    o.append(table(['Field', 'Content'], meta, mono=[True, False]))
    if s['rows']:
        o.append('\\vhead{The detail rows of that item}')
        o.append(table(['Row', 'Value'], [[neutral(r[0]), neutral(str(r[1]))] for r in s['rows']],
                       mono=[False, False]))
    o.append(r"""
\section{Pictograms}
A console is read at a glance, so every item carries a mark for its kind. The
marks are drawn from the characters the font already has, which keeps the page a
single file with no image to load.
""")
    o.append(table(['Kind', 'Mark'], [[p['key'], p['glyph']] for p in D['pictograms']],
                   mono=[True, False], long=False))
    o.append(r"""
\section{Working without a mouse}
Everything in the console can be reached by typing. The recogniser list below is
the one the code carries; a button in the interface sends exactly the same text,
so the two paths cannot drift apart.
""")
    o.append(table(['Command', 'Pattern'],
                   [[c['id'], c['pattern']] for c in D['consoleCommands']],
                   mono=[False, True],
                   caption='Every command the console recognises.', label='tab:console-commands'))
    o.append(r"""
\section{The actions offered on the items}
An item that can be acted on carries its action with it, so the operator never has
to remember where to go next.
""")
    acts = [a.split(' — ') for a in D['consoleActions']]
    o.append(table(['Offered as', 'Sends'], [[neutral(a[0]), a[1] if len(a) > 1 else ''] for a in acts],
                   mono=[False, True]))
    o.append(r"""
\section{The view builders}
Each view is a function of the loaded data and nothing else. Two are printed here;
the rest are in Chapter~\ref{ch:val-functions} with the record of what they
returned when they were called.
""")
    for fn in ['mgViewLoad', 'mgViewReview']:
        if SRC.get(fn):
            o.append('\\vhead{\\vfn{%s}}' % esc(fn))
            o.append(src(fn))
    return '\n'.join(o)

out('ch16_console.tex', ch_console())
print('console chapter', os.path.getsize('tex/ch16_console.tex'))

# ============================================================ the two modes
def ch_modes():
    cat = D['catalogue']
    o = [r"""\chapter{Command mode and assisted mode}\label{ch:modes}

Two more faces, for the same reason the console exists: what a person needs from
the page depends on what they are doing. An analyst who repeats the same report
every week wants to write it down once and run it. An analyst who is deciding what
to include wants to see the choices. Both end at the same place --- a report or an
archive --- and both drive one catalogue, so the two never disagree about what can
be produced.

They sit either side of the console in the status bar, so the three ways of
working are one row apart.
""",
    table(['Button', 'Opens'],
          [[b['label'], {'sb-cancel': 'stops the running task', 'sb-command': 'command mode',
                         'sb-console': 'the console', 'sb-assist': 'assisted mode',
                         'sb-save': 'writes the status report', 'sb-toggle': 'the detail lines'}.get(b['id'], '')]
           for b in D['statusBar']], mono=[False, False], long=False),
    r"""
\section{One catalogue}
Everything that can leave the page is an item: a figure or a table. An item knows
how to produce itself twice --- as a drawing for the report and as a file for the
archive --- and it computes nothing of its own. A figure asks the same function the
graphs tab asks; a table asks the same function the export writes. That is what
makes a figure in a report the figure on the screen.
"""]
    rows = [[c['id'], c['kind'], c['group'], neutral(c['title'])] for c in cat]
    o.append(table(['Identifier', 'Kind', 'Group', 'What it is'], rows,
                   mono=[True, False, False, False],
                   caption='The catalogue both modes select from.', label='tab:catalogue'))
    o.append(r"""
\section{Command mode}
A window that takes one line at a time, and a box that takes a written procedure.
The commands are deliberately few and deliberately literal: a line that reads
\vfn{select img:curves} does one thing, and the window says what it did.
""")
    o.append(table(['Command', 'What it does'],
                   [[c['command'], c['meaning']] for c in D['cmdHelp']],
                   mono=[True, False],
                   caption='Every command the window accepts.', label='tab:cmd-commands'))
    o.append(r"""
A pattern may carry \vfn{*} and \vfn{?}, and three words stand for groups:
\vfn{all}, \vfn{images} and \vfn{data}. Several patterns may be given on one line.

\section{A procedure}
The box below is the example the page itself offers. Pasting it and pressing Run
produces the same report every week, from whatever files are loaded at the time.
""")
    o.append(plain("""# report for the current run
lab Laboratory of molecular biology
analyst A. Analyst
title Weekly screening report
only img:curves
select img:plate data:cq_values data:runs_and_qc
pdf weekly_screening"""))
    o.append(r"""
A multi-line paste into the command line is not run line by line by accident: it
goes to the script box and waits for Run, so a procedure is always read before it
is executed.

\section{Assisted mode}
The same catalogue as a checklist, grouped the way the page groups its figures,
with the laboratory fields, the run the run-level figures use, and the choice of
output. Nothing in it can be done that cannot be done in command mode, and nothing
in command mode is missing from it.

\subsection*{The selection as a file}
A laboratory that always reports the same things should not have to tick the same
boxes. The selection leaves as a CSV and comes back as one. The template carries
every item, whether it is available and whether it is included; only the
\vfn{include} column is read back, so a file written months ago still applies.
""")
    o.append(table(['Column', 'Meaning'],
                   [['id', 'the item identifier; this is what is matched'],
                    ['kind', 'figure or table'],
                    ['group', 'the group the item belongs to'],
                    ['title', 'what the item is, for a person reading the file'],
                    ['available', 'whether the loaded data can produce it now'],
                    ['include', 'yes or no; the only column read back']],
                   mono=[True, False]))
    o.append('\\vhead{The first lines of the template}')
    o.append(plain('\n'.join(neutral(l) for l in D['templateHead'])))
    o.append(r"""
\section{Who did the work}
A report that cannot be attributed is of little use in a laboratory. The profile
therefore carries two more fields, \vfn{lab.name} and \vfn{lab.analyst}. They are
shown on the profile header, they are printed on every report, and they are part
of the profile --- so the profile checksum changes when they change, and a report
made under one analyst cannot be confused with a report made under another.

\section{The report}
The report is built inside the page. There is no library to load and no service to
call, because the page has to work with no network at all. The writer emits the
1.4 form of the format with the two standard text faces, which are never embedded,
and carries each figure as a compressed image, which the format holds natively.

A report has a cover that states the laboratory, the analyst, the profile and its
checksum, the files that were loaded and what was selected, followed by one
section per item.
""")
    o.append(table(['Part', 'What it holds'],
                   [['cover', 'laboratory, analyst, profile, checksum, files, contents'],
                    ['figure section', 'the drawing at the width of the text, then the numbers behind it'],
                    ['table section', 'the table, one row per line, with the number of rows not shown'],
                    ['every page', 'the same text block as this document uses']],
                   mono=[False, False]))
    o.append(r"""
Two rules govern the tables in a report, and they are the rules this document
follows as well: a row is one line, and a column that does not fit is shortened
rather than wrapped. Column widths are allocated by filling from the narrowest
column upwards, so one wide column cannot take the page.

\section{The code}
The writer, the catalogue and the two windows are printed in full in
Chapter~\ref{ch:val-functions} with the record of what each returned. The two
functions that decide what a report looks like are worth reading here.
""")
    for fn in ['selTableBlock', 'selBuildReport']:
        if SRC.get(fn):
            o.append('\\vhead{\\vfn{%s}}' % esc(fn))
            o.append(src(fn))
    return '\n'.join(o)

out('ch17_modes.tex', ch_modes())
print('modes chapter', os.path.getsize('tex/ch17_modes.tex'))

# ============================================================ structure
def ch_structure():
    areas = {}
    for r in V['rows']:
        pass
    o = [r"""\chapter{How the code is structured, and why}\label{ch:structure}

The page is one file, and a single file is the easiest place in the world to write
something no one can maintain. Two published engineering methods were used to keep
that from happening: a component-design method written for flight software, and an
agency standard for the architecture of onboard software. Neither is named here,
because the page is not certified against either and a name on a document is a
claim. What follows is what was taken from them and where it shows in the code.

\section{What the component method contributed}
The first method describes software as a set of components that each do one thing,
declare what they take and what they give, and talk to each other only through
those declarations. Five of its rules were applied literally.
""",
    table(['Rule taken', 'Where it shows in the page'],
          [['one responsibility per component',
            'a decoder decodes, a profile decides, a chart draws; no function does two of the three'],
           ['declared inputs and outputs',
            'every function in Chapter~\\ref{ch:val-functions} is recorded with what it was given and what it returned'],
           ['commands separated from measurements',
            'a command changes state and says so; a measurement is read-only and is probed as read-only'],
           ['no hidden state',
            'the seven functions that change state are named, and every other function is proved not to'],
           ['deterministic behaviour',
            'the same file gives the same values; the property checks in Chapter~\\ref{ch:val-oracles} assert it']],
          mono=[False, False],
          caption='What the component-design method contributed.', label='tab:struct-component'),
    r"""
The strongest of these is the third. A component that both measures and acts can
be tested only by acting, which is why the page keeps the two apart: the whole
validation of Chapter~\ref{ch:val-functions} rests on being able to call a function
and know that calling it changed nothing.

\section{What the architectural standard contributed}
The second is a standard for the architecture of onboard software: how the layers
are separated, how data flows between them, what happens when something fails, and
what the crew sees while it is happening. Six of its requirements shaped the page.
""",
    table(['Requirement', 'How the page meets it'],
          [['layers with one direction of flow',
            'files to model, model to decision, decision to view; a view never writes to the model'],
           ['one model, many readers',
            'the run model is built once and read by the profile, the charts, the review and every export'],
           ['a declared failure policy',
            'a file that cannot be read becomes a stated fault, not an empty screen'],
           ['bounded resources',
            'a large selection is decoded one file at a time and the memory held is shown in the status bar'],
           ['the operator is told what is happening',
            'every long operation is a named task with progress, and the bar carries the phase'],
           ['an interface that works under stress',
            'the console: large type, one fact per item, every view reachable by typing']],
          mono=[False, False],
          caption='What the architectural standard contributed.', label='tab:struct-arch'),
    r"""
\section{The shape that came out of it}
The result is a file with five bands, in this order: the shared utilities, the
decoders, the model, the deciders, and the views. A function is in exactly one
band, and the bands are in the file in the order the data moves through them, so
the line number of a function says which band it belongs to.
""",
    table(['Band', 'What lives there', 'What it may call'],
          [['utilities', 'formatting, hashing, archives, small mathematics', 'nothing above it'],
           ['decoders', 'the container readers and the exchange reader', 'utilities'],
           ['model', 'the run model, the plate, the curves, the history', 'utilities'],
           ['deciders', 'the profile, the control charts, the forensic review', 'model, utilities'],
           ['views', 'tabs, graphs, the console, the two modes, the exports', 'everything below']],
          mono=[False, False]),
    r"""
\section{What neither method excuses}
Neither method makes a value right. They make a wrong value findable: a decoder
that reports nothing when it should report something is visible because the layer
above it has a declared input; a rule that fires when it should not is visible
because the decision is separate from the drawing. The defects listed in
Chapter~\ref{ch:val-findings} were all found that way, and none of them would have
been found by reading the file from top to bottom.
"""]
    return '\n'.join(o)

out('ch18_structure.tex', ch_structure())
print('structure chapter', os.path.getsize('tex/ch18_structure.tex'))
