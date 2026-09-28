# -*- coding: utf-8 -*-
"""Generate the RDML reader validation report (LaTeX) from the captured evidence."""
import io, json, re, os, textwrap, collections

D = json.load(open("validation_data.json"))
SRC = json.load(open("prod_functions.json"))
OUT = "tex"

REC = D["records"]
byfn = collections.OrderedDict()
for r in REC:
    byfn.setdefault(r["fn"], []).append(r)

def esc(s):
    s = str(s)
    for a, b in [("\\", r"\textbackslash{}"), ("&", r"\&"), ("%", r"\%"), ("$", r"\$"),
                 ("#", r"\#"), ("_", r"\_"), ("{", r"\{"), ("}", r"\}"),
                 ("~", r"\textasciitilde{}"), ("^", r"\textasciicircum{}")]:
        s = s.replace(a, b)
    return s

SEN="\u241F"
def brk(s, after='_-.,:;"/[]{}()|=+ '):
    s=str(s); out=[]; run=0
    for i,ch in enumerate(s):
        out.append(ch)
        b = ch in after
        if not b and i+1 < len(s) and ch.islower() and s[i+1].isupper(): b = True
        run = 0 if b else run+1
        if run >= 13: b = True; run = 0
        if b: out.append(SEN)
    return "".join(out)
def escb(s): return esc(brk(s)).replace(SEN, r"\allowbreak{}")

def code(text, caption=None, label=None, tiny=False):
    style = "jstiny" if tiny else "js"
    head = ""
    if caption:
        head = "\\begin{lstlisting}[style=%s,caption={%s}%s]\n" % (
            style, caption.replace("]", "]"), (",label={%s}" % label) if label else "")
    else:
        head = "\\begin{lstlisting}[style=%s]\n" % style
    return head + text.replace("\r", "") + "\n\\end{lstlisting}\n"

def jdump(v, width=104):
    s = json.dumps(v, indent=1, ensure_ascii=False)
    out = []
    for line in s.split("\n"):
        while len(line) > width:
            cut = line.rfind(" ", 0, width)
            if cut < 40: cut = width
            out.append(line[:cut]); line = "   " + line[cut:].lstrip()
        out.append(line)
    return "\n".join(out)

PROV = {
 "R": ("R", "Real file, unmodified", "A file supplied by the laboratory or by the RDML workshop, used byte for byte. Its SHA-256 is in Table 2."),
 "D": ("D", "Derived from a real file", "An object produced from a real file by a stated operation of the code under test, e.g. the first \\texttt{<run>} element of a parsed document."),
 "S": ("S", "Synthetic, written for the test", "A literal value constructed for this report. Every synthetic value is printed in full so the reader can reproduce it."),
}

# ---------------------------------------------------------------- preamble
PRE = r"""
\documentclass[10pt,a4paper,twoside]{report}
\usepackage{fontspec}
\setmainfont{DejaVu Serif}[Scale=0.92]
\setsansfont{DejaVu Sans}[Scale=0.90]
\setmonofont{DejaVu Sans Mono}[Scale=0.80]
\usepackage[a4paper,top=22mm,bottom=24mm,left=24mm,right=20mm,headheight=14pt]{geometry}
\usepackage{xcolor}
\usepackage{graphicx}
\usepackage{longtable,tabularx,booktabs,array}
\usepackage{listings}
\usepackage{tikz}
\usetikzlibrary{shapes.geometric,positioning,calc,fit,backgrounds}
\usepackage{fancyhdr}
\usepackage{needspace}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{titlesec}

\definecolor{kw}{RGB}{20,70,160}
\definecolor{cm}{RGB}{90,110,90}
\definecolor{st}{RGB}{150,60,20}
\definecolor{rule}{RGB}{200,205,212}
\definecolor{okc}{RGB}{20,110,60}
\definecolor{badc}{RGB}{170,30,30}
\definecolor{panel}{RGB}{246,248,251}

\lstdefinestyle{js}{
  language=Java, basicstyle=\ttfamily\scriptsize, keywordstyle=\color{kw},
  commentstyle=\color{cm}\itshape, stringstyle=\color{st},
  breaklines=true, breakatwhitespace=false, columns=fullflexible, keepspaces=true,
  showstringspaces=false, tabsize=2, numbers=left, numberstyle=\ttfamily\tiny\color{gray},
  numbersep=7pt, xleftmargin=20pt, framexleftmargin=16pt, frame=single, rulecolor=\color{rule},
  backgroundcolor=\color{panel}, aboveskip=7pt, belowskip=7pt, upquote=true,
  literate={·}{{\textperiodcentered}}1 {—}{{---}}1 {–}{{--}}1 {…}{{\ldots}}1 {≤}{{$\leq$}}1
           {≥}{{$\geq$}}1 {×}{{$\times$}}1 {→}{{$\rightarrow$}}1 {²}{{$^2$}}1 {°}{{$^\circ$}}1
           {₀}{{$_0$}}1 {"}{{"}}1 {"}{{"}}1 {'}{{'}}1 {'}{{'}}1
}
\lstdefinestyle{jstiny}{style=js, basicstyle=\ttfamily\tiny, numbers=none}
\lstdefinestyle{plain}{style=js, keywordstyle=\color{black}, numbers=none, language={}}

\pagestyle{fancy}\fancyhf{}
\renewcommand{\headrulewidth}{0.3pt}\renewcommand{\footrulewidth}{0.3pt}
\fancyhead[LE,RO]{\sffamily\scriptsize RDML reader — validation report}
\fancyhead[RE,LO]{\sffamily\scriptsize\leftmark}
\fancyfoot[C]{\sffamily\scriptsize Page \thepage\ of \pageref{LastPage}}
\usepackage{lastpage}
\fancypagestyle{plain}{\fancyhf{}\fancyfoot[C]{\sffamily\scriptsize Page \thepage\ of \pageref{LastPage}}
  \renewcommand{\headrulewidth}{0pt}\renewcommand{\footrulewidth}{0.3pt}}

\titleformat{\chapter}[display]{\sffamily\LARGE\bfseries}{\sffamily\normalsize\MakeUppercase{\chaptertitlename\ \thechapter}}{6pt}{}
\titlespacing*{\chapter}{0pt}{-14pt}{18pt}
\titleformat{\section}{\sffamily\large\bfseries}{\thesection}{0.7em}{}
\titleformat{\subsection}{\sffamily\normalsize\bfseries}{\thesubsection}{0.7em}{}
\setlength{\parindent}{0pt}\setlength{\parskip}{4pt}
\setlength{\tabcolsep}{4pt}\renewcommand{\arraystretch}{1.16}
\newcommand{\PASS}{\textcolor{okc}{\textbf{pass}}}
\newcommand{\FAILED}{\textcolor{badc}{\textbf{fail}}}
\newcommand{\fn}[1]{\texttt{#1}}
\newcommand{\A3start}{\clearpage\pdfpagewidth=420mm\pdfpageheight=297mm
  \newgeometry{top=16mm,bottom=16mm,left=18mm,right=18mm,headheight=14pt}}
\newcommand{\A3end}{\clearpage\pdfpagewidth=210mm\pdfpageheight=297mm\restoregeometry}
\tikzset{
  box/.style={draw=rule!60!black, fill=panel, rounded corners=2pt, align=center,
              font=\sffamily\footnotesize, inner sep=5pt, minimum height=9mm, text width=34mm},
  wide/.style={box, text width=52mm},
  narrow/.style={box, text width=25mm},
  dec/.style={draw=rule!60!black, fill=white, diamond, aspect=2.4, align=center,
              font=\sffamily\scriptsize, inner sep=1pt, text width=30mm},
  io/.style={box, fill=white, draw=kw!70},
  ok/.style={box, fill=okc!8, draw=okc!60},
  bad/.style={box, fill=badc!8, draw=badc!60},
  fl/.style={->, draw=rule!50!black, thick},
  lbl/.style={font=\sffamily\scriptsize, inner sep=1.5pt, fill=white}
}
"""

doc = [PRE, r"\begin{document}"]
W = doc.append

# ---------------------------------------------------------------- title
W(r"""
\begin{titlepage}\centering\sffamily
\vspace*{18mm}
{\Huge\bfseries RDML reader\par}
\vspace{4mm}
{\LARGE Function-by-function validation report\par}
\vspace{10mm}
{\large qPCR raw values, open formats, quality control and forensics\par}
\vspace{2mm}
{\large LightCycler 480 \textperiodcentered{} QuantStudio 3/5 \textperiodcentered{} RDML 1.0--1.4\par}
\vspace{16mm}
\begin{minipage}{0.86\textwidth}\centering\small
\begin{tabular}{@{}ll@{}}
\toprule
Build under test & \texttt{qpcr\_qc\_forensics.html} \\
SHA-256 & \texttt{""" + esc(D["page"]["sha256"]) + r"""} \\
Size & """ + "{:,}".format(D["page"]["bytes"]) + r""" bytes \\
Symbols validated & 15 functions, 2 constants \\
Test records & """ + str(len(REC)) + r""" \\
Corpus & """ + str(len(D["corpus"])) + r""" instrument and exchange files \\
Browser faults during capture & """ + str(len(D["pageErrors"])) + r""" \\
Capture run & \texttt{""" + esc(D["when"]) + r"""} \\
\bottomrule
\end{tabular}
\end{minipage}
\vfill
{\small This report states, for every function of the RDML reader, what it was given, where that
input came from, what it returned, and how the verdict was reached. Inputs that were constructed
for the test are marked as such and printed in full.\par}
\vspace{8mm}
\end{titlepage}
\tableofcontents
\clearpage
""")

# ---------------------------------------------------------------- ch 1 purpose
W(r"\chapter{Purpose, scope and reading guide}")
W(r"""
\section{What this document is}
This is the validation record of the RDML reader added to the page on 24 September 2026. It is
written to be checked rather than believed: every number in it was produced by a harness that is
printed in Appendix~\ref{app:harness}, run against the build whose SHA-256 is on the title page,
and the harness writes a machine-readable record (\texttt{validation\_data.json}) from which this
document is generated. Re-running the harness regenerates every table here.

\section{Why the provenance of the input matters}
The functions under test were written together with most of their test inputs. That is a conflict
of interest, and the only honest response is to declare, for every single input, where it came
from. Three classes are used throughout, and every input table names its class:

\begin{longtable}{@{}p{10mm}p{42mm}p{\dimexpr\linewidth-58mm\relax}@{}}
\toprule
\textbf{Class} & \textbf{Meaning} & \textbf{What it implies for the evidence} \\
\midrule\endhead
""")
for k in ["R", "D", "S"]:
    c, n, m = PROV[k]
    W("\\textbf{%s} & %s & %s \\\\\n\\addlinespace\n" % (c, esc(n), m))
W(r"""\bottomrule
\end{longtable}

Class~R inputs carry the whole weight of the validation: they were produced by instruments and by
the RDML-Tools of the Freising workshop, long before this reader existed, and neither their content
nor their structure could be arranged to suit it. Class~D inputs are real data that the code under
test has already transformed, so they test a later stage against the output of an earlier one.
Class~S inputs exist only for boundary conditions --- an empty string, a malformed document, a null
argument --- where no real file offers the case. They are printed verbatim so that nothing is hidden
in a description.

\section{The strongest single piece of evidence}
One experiment in the corpus, \texttt{CORPUS-RDML-1}, exists both as the instrument's own
container (\texttt{.eds}) and as an RDML export of the same run. The page already decodes the first
by a path that has nothing to do with the reader under test. Reading both and comparing the Cq of
every reaction is therefore an external check that no amount of self-written test data could
provide. It is reported in section~\ref{sec:oracle}.

\section{How to read a function section}
Each function gets: what it is for; its signature and its place in the call graph; its complete
source as it stands in the build under test, with the production line numbers; a table of every
input it was given, with the provenance class; a table of what it returned; a flow diagram where
the control flow justifies one; and the verdict. Nothing is abbreviated. Where a returned value is
large it is printed in full in an appendix rather than truncated in place.
""")

# ---------------------------------------------------------------- ch 2 corpus
W(r"\chapter{The corpus and how it was obtained}\label{ch:corpus}")
W(r"""
\section{Files}
Eight files, none of them produced by this project. Five are the exercise files of the RDML-Tools
workshop \emph{Web-based analysis of qPCR data} (Freising, March 2023); two are exchange exports
supplied by the laboratory; one is the instrument container that pairs with the first of those.

\begin{longtable}{@{}p{56mm}r p{\dimexpr\linewidth-56mm-20mm-6pt\relax}@{}}
\toprule
\textbf{File} & \textbf{Bytes} & \textbf{SHA-256} \\
\midrule\endhead
""")
NOTE = {
 "CORPUS-RDML-1.eds": "Instrument container, QuantStudio. Decoded by the page's existing \\texttt{.eds} path, not by the reader under test. Reference for the cross-format oracle.",
 "CORPUS-RDML-1.rdml": "RDML 1.2 export of the run above. Names an instrument; carries Cq; no re-analysis tool.",
 "GeneExpression_ddCt_Fast_Adv_MMx_10uL.rdml": "RDML 1.2 export of a QuantStudio demonstration run.",
 "example_1_raw.rdml": "Workshop file, RDML 1.3. Amplification and melting fluorescence only; no Cq anywhere.",
 "example_2_tm_annotated.rdml": "Workshop file. The same data with melting temperatures annotated on the targets.",
 "example_3_linregpcr.rdml": "Workshop file. The same data after LinRegPCR: Cq, N$_0$, efficiency, exclusions and notes.",
 "example_4_interrun.rdml": "Workshop file. The same data again after between-plate correction.",
 "example_LCGreen_raw.rdml": "Workshop file. Single dye, one run, deliberate artefacts; no Cq.",
}
for c in D["corpus"]:
    W("\\texttt{%s} & %s & {\\ttfamily\\scriptsize %s} \\\\\n" % (
        escb(c["file"]), "{:,}".format(c["bytes"]), esc(c["sha256"][:32]) + r"\newline " + esc(c["sha256"][32:])))
    W("\\multicolumn{3}{@{}p{\\linewidth}@{}}{\\small %s}\\\\\n\\addlinespace\n" % NOTE.get(c["file"], ""))
W(r"""\bottomrule
\end{longtable}

\section{What the corpus contains, as read}
The table below is the output of \fn{rdmlParse} over the whole corpus and is repeated in
section~\ref{sec:rdmlParse} with the per-run detail. It is placed here because it also serves as the
description of the corpus.

\begin{longtable}{@{}p{40mm}c c r r r r p{22mm}@{}}
\toprule
\textbf{File} & \textbf{ver} & \textbf{runs} & \textbf{wells} & \textbf{curves} & \textbf{melt} & \textbf{Cq} & \textbf{state} \\
\midrule\endhead
""")
agg = collections.OrderedDict()
for r in byfn.get("rdmlParse", []):
    if "[run" not in r["case"]: continue
    f = r["case"].split(" [")[0]
    o = r["output"]
    a = agg.setdefault(f, {"ver": r["input"]["version"], "runs": 0, "wells": 0, "curves": 0, "melt": 0, "cq": 0})
    a["runs"] += 1; a["wells"] += o["wells"]; a["curves"] += o["curves"]
    a["melt"] += o["meltPoints"]; a["cq"] += o["withCq"]
state = {r["input"].get("file", ""): r["output"]["state"] for r in byfn.get("runProcessingState", []) if isinstance(r.get("input"), dict)}
for f, a in agg.items():
    st = next((v for k, v in state.items() if k == f), "")
    W("\\texttt{%s} & %s & %d & %d & %d & %d & %d & %s \\\\\n" % (
        escb(f.replace(".rdml", "")), a["ver"], a["runs"], a["wells"], a["curves"], a["melt"], a["cq"], esc(st or "--")))
W(r"""\bottomrule
\end{longtable}
\small ``melt'' is the number of melting acquisition points of the first run of the file; ``Cq'' is
the number of reactions carrying a crossing point after the ceiling rule of
section~\ref{sec:ceiling} has been applied.\normalsize
""")

io.open(os.path.join(OUT, "part1.tex"), "w", encoding="utf-8").write("\n".join(doc))
print("part1 written", sum(len(x) for x in doc), "chars")
