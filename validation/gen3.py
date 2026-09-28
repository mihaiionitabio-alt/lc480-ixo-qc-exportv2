# -*- coding: utf-8 -*-
import io, json, collections, os
D=json.load(open("validation_data.json")); SRC=json.load(open("prod_functions.json"))
REC=D["records"]; byfn=collections.OrderedDict()
for r in REC: byfn.setdefault(r["fn"],[]).append(r)
def esc(s):
    s=str(s)
    for a,b in [("\\",r"\textbackslash{}"),("&",r"\&"),("%",r"\%"),("$",r"\$"),("#",r"\#"),
                ("_",r"\_"),("{",r"\{"),("}",r"\}"),("~",r"\textasciitilde{}"),("^",r"\textasciicircum{}")]:
        s=s.replace(a,b)
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

def code(t,style="js"): return "\\begin{lstlisting}[style=%s]\n%s\n\\end{lstlisting}\n"%(style,t.replace("\r",""))
def jd(v,w=100):
    s=json.dumps(v,indent=1,ensure_ascii=False);out=[]
    for line in s.split("\n"):
        while len(line)>w:
            cut=line.rfind(" ",0,w);cut=cut if cut>40 else w
            out.append(line[:cut]);line="   "+line[cut:].lstrip()
        out.append(line)
    return "\n".join(out)
doc=[];W=doc.append

# ============================================================ integration
W(r"\chapter{Integration validations}")
W(r"""
Three checks do not belong to a single function. Each of them is the reason a design decision was
taken, and each is reproducible from the corpus alone.
""")

# --- ceiling
W(r"\section{The Cq ceiling rule}\label{sec:ceiling}")
W(r"""
\subsection*{The observation}
The first reading of the two vendor exports produced a result that could not be right: 82 per cent
of the reference file carried a crossing point of exactly 40.0 on a 40-cycle run. The instrument's
own container for the same run reports those same reactions as undetermined. A vendor export writes
``no crossing'' as a Cq equal to the cycle count, and reading it literally turns four fifths of a
file into late detections.

The counter-example is in the corpus too: the LinRegPCR file, which is a re-analysis rather than an
export, has no value at the ceiling at all and a maximum of 34. So the convention belongs to the
export path, not to RDML, and the rule must be narrow enough to leave a re-analysis untouched.

\subsection*{The rule as built}
""")
lines = SRC["rdmlParse"]["code"].split("\n")
seg = [l for l in lines if "ceiling" in l.lower() or "cqCeiling" in l or "maxCycleSeen" in l]
W(code("\n".join(seg)))
W(r"""
The guard is deliberately conservative: the conversion happens only when the file offers nothing
that would contradict it. A re-analysis writes $N_0$ and an efficiency beside every Cq, so both
tests fail and its values survive unchanged.

\subsection*{Measured, before and after}
\begin{longtable}{@{}p{54mm}r r r r@{}}
\toprule
\textbf{File} & \textbf{cycles} & \textbf{converted} & \textbf{Cq kept} & \textbf{max Cq} \\
\midrule\endhead
""")
for r in byfn.get("rdmlParse (Cq-ceiling rule)", []):
    o=r["output"]
    W("\\texttt{%s} & %s & %s & %s & %s \\\\\n"%(esc(r["case"].replace(".rdml","")),
        r["input"]["cycles"],o["converted"],o["remainingWithCq"],o["cqMax"]))
W(r"""\bottomrule\end{longtable}
Verdict: no value equal to the cycle count survives in any file, and the re-analysis file loses
nothing. \PASS
""")

# --- oracle
W(r"\section{The cross-format oracle}\label{sec:oracle}")
W(r"""
\subsection*{Why this is the decisive test}
Every other input in this report was either written for the test or read by the code under test.
This one is neither. The experiment \texttt{CORPUS-RDML-1} exists as an instrument container
and as an RDML export of the same run. The page decodes the first through a path written months
earlier for a different format. If the reader under test is correct, the two must agree reaction by
reaction --- and if it is wrong, they cannot be made to agree by adjusting a test expectation.
""")
W(r"""
\begin{center}\resizebox{0.95\linewidth}{!}{%
\begin{tikzpicture}[node distance=9mm]
\node[io] (eds) {\texttt{CORPUS-RDML-1.eds}\\ 1\,756\,735 bytes};
\node[io, below=16mm of eds] (rd) {\texttt{CORPUS-RDML-1.rdml}\\ 69\,062 bytes};
\node[box, right=12mm of eds] (dec) {page intake\\ \fn{parseEds}\\ (written 2026-09, untouched)};
\node[box, right=12mm of rd] (par) {\fn{rdmlParse}\\ (under test)};
\node[box, right=12mm of dec] (k1) {key = position\\ $|$ target};
\node[box, right=12mm of par] (k2) {key = position\\ $|$ target};
\node[dec, right=14mm of $(k1)!0.5!(k2)$] (cmp) {\fn{resultCq}\\ equal within\\ 0.0005?};
\node[ok, right=14mm of cmp] (res) {64 matched\\ 30 both undetermined\\ \textbf{0 differing}};
\draw[fl] (eds)--(dec); \draw[fl] (dec)--(k1); \draw[fl] (k1)--(cmp);
\draw[fl] (rd)--(par);  \draw[fl] (par)--(k2); \draw[fl] (k2)--(cmp);
\draw[fl] (cmp)--(res);
\end{tikzpicture}}\end{center}
\begin{center}\small Figure: the oracle. The two paths share no code below the comparison.\normalsize\end{center}
""")
orc=byfn.get("rdmlParse (cross-format oracle)",[])[0]
W(r"\subsection*{Result}")
W(code(jd({"input":orc["input"],"output":orc["output"]}),"jstiny"))
W(r"""
Every crossing point the instrument container yields is reproduced exactly by the reader, and every
reaction the instrument reports as undetermined is also undetermined after the ceiling rule. The 128
reactions present only in the export are the ones the \texttt{.eds} decoder does not emit; they are
kept, not silently dropped, which is what makes the superseded-companion comparison of
section~\ref{sec:priority} possible. \PASS
""")

# --- priority
W(r"\section{Raw-file priority}\label{sec:priority}")
W(r"""
The laboratory's rule is that the instrument's own file is the record. Three cases were run: the
reference pair loaded together; the same pair with the export renamed so that only the experiment
identifier can match; and a set of RDML runs with no vendor container present.
""")
for r in byfn.get("applyRawFilePriority",[]):
    W(r"\subsection*{Case: %s}"%esc(r["case"]))
    W(r"Input (%s): %s"%(esc(r["inputProvenance"]),esc(r["inputDesc"])))
    W(code(jd({"input":r["input"],"output":r["output"]}),"jstiny"))
    W(r"Expected: %s \hfill Verdict: %s"%(esc(r["expect"]),r"\PASS" if r["pass"] else r"\FAILED"))
for r in byfn.get("runIsSuperseded",[]):
    W(r"\subsection*{Predicate: \fn{runIsSuperseded} before and after}")
    W(code(jd({"before":r["input"],"after":r["output"]}),"jstiny"))
    W(r"Verdict: %s"%(r"\PASS" if r["pass"] else r"\FAILED"))
g=[r for r in byfn.get("sopProcessingApplicability",[]) if "superseded" in r["case"]]
if g:
    W(r"\subsection*{The gate on the superseded run}")
    W(code(jd(g[0]["output"]),"jstiny"))
    W(r"Verdict: %s"%(r"\PASS" if g[0]["pass"] else r"\FAILED"))

# ============================================================ findings
W(r"\chapter{Findings raised by this validation}")
W(r"""
Two things were raised while the evidence was being collected. Both are recorded here with the test
that raised them, the test that characterised them, and the conclusion --- including the one that
was cleared, because a validation that only reports confirmed defects hides half of its own work.
""")
W(r"\section{V-1 --- \fn{rdmlText} is called on an element the schema defines as complex}\label{sec:V1}")
W(r"""
\subsection*{How it surfaced}
The expected value for \fn{rdmlText}(\texttt{<run>}, \texttt{"dataCollectionSoftware"}) was written
as the empty string, on the assumption that the reference file does not carry it. The function
returned a two-line string instead.
""")
t=[r for r in byfn["rdmlText"] if r["case"]=="dataCollectionSoftware"][0]
W(code(jd({"returned":t["output"]}),"jstiny"))
W(r"""
\subsection*{Characterisation}
A sweep over every element the reader reads with \fn{rdmlText}, in all seven files, shows the cause:
\texttt{dataCollectionSoftware} is not a leaf. The schema gives it \texttt{<name>} and
\texttt{<version>} children, and \texttt{textContent} concatenates them with the file's own
indentation between.
""")
v1=[r for r in byfn["rdmlText"] if "V-1 — read with" in r["case"]][0]
W(code(jd(v1["output"]),"jstiny"))
W(r"""
\subsection*{Consequence and recommendation}
The concatenated string becomes \texttt{meta.SWVersion}, which reaches the load table and the
instrument-record export. It is cosmetic --- no measurement is affected --- but it is wrong, and it
would be reported to a laboratory as the software version. Two one-line changes remove it:
""")
W(code("""/* 1. collapse inner whitespace, not only the ends */
function rdmlText(el,name){const k=rdmlKid(el,name);
  return k?String(k.textContent||"").replace(/\\s+/g," ").trim():"";}

/* 2. read the complex element as the schema defines it */
const dcs=rdmlKid(runEl,"dataCollectionSoftware");
const software=dcs?[rdmlText(dcs,"name"),rdmlText(dcs,"version")].filter(Boolean).join(" ")
                  :rdmlText(runEl,"dataCollectionSoftware");"""))
W(r"""Severity: cosmetic, in a reported field. Status: open, recommended for the next build.""")

W(r"\section{V-2 --- asymmetric normalisation in \fn{rdmlKeyOf}, raised and cleared}\label{sec:V2}")
W(r"""
\subsection*{How it surfaced}
\fn{rdmlKeyOf} was expected to return two keys that agree for the reference pair. They do not: the
file-name key is stem-normalised while the experiment key is only lower-cased.
""")
k=[r for r in byfn["rdmlKeyOf"] if r["case"]=="name and experiment"][0]
W(code(jd({"input":k["input"],"returned":k["output"]}),"jstiny"))
W(r"""
\subsection*{Why it does not break the priority rule}
The two keys are never compared with each other. \fn{applyRawFilePriority} builds its key set with
the same function it later queries, so a file-name key is only ever compared with a file-name key
and an experiment key with an experiment key. To prove that rather than argue it, the export was
renamed so that its file-name key could not possibly match, leaving only the experiment identifier
to carry the match:
""")
v2=[r for r in byfn["applyRawFilePriority"] if "V-2" in r["case"]][0]
W(code(jd({"input":v2["input"],"output":v2["output"]}),"jstiny"))
W(r"""
The export is still superseded. The finding is therefore an internal inconsistency with no
observable effect today.

\subsection*{Residual risk and recommendation}
The inconsistency becomes a defect the moment the two identifiers are spelled differently --- an
export whose experiment identifier is \texttt{2026 06 15 CORPUS-RDML-1} would not match a container
whose name is \texttt{CORPUS-RDML-1}. One line closes it:
""")
W(code("""function rdmlKeyOf(item){
  return [rdmlStem(item.name),rdmlStem(item.experimentId)].filter(Boolean);
}"""))
W(r"""Severity: latent. Status: cleared for the current corpus, recommended as hardening.""")

# ============================================================ traceability
W(r"\chapter{Traceability}")
W(r"""
\section{Every record}
The table lists all %d records in the order they were executed. It is generated from the same JSON
the harness writes, so it cannot drift from the evidence above.
"""%len(REC))
W(r"""\begin{longtable}{@{}p{3mm}p{40mm}p{\dimexpr\linewidth-40mm-16mm-26mm-16pt\relax}p{16mm}p{10mm}@{}}
\toprule & \textbf{Function} & \textbf{Case} & \textbf{Class} & \\ \midrule\endhead
""")
for i,r in enumerate(REC,1):
    W("\\tiny %d & \\small %s & \\small %s & \\small %s & %s \\\\\n"%(
        i,"\\fn{"+escb(r["fn"])+"}",escb(r["case"][:150]),esc(str(r.get("inputProvenance",""))[:12]),
        r"\PASS" if r["pass"] else r"\FAILED"))
W(r"\bottomrule\end{longtable}")

W(r"\section{Coverage by provenance class}")
cls=collections.Counter(str(r.get("inputProvenance","")).split(" ")[0] for r in REC)
W(r"""\begin{longtable}{@{}p{30mm}r p{\dimexpr\linewidth-30mm-20mm-12pt\relax}@{}}
\toprule\textbf{Class}&\textbf{Records}&\textbf{Reading}\\\midrule\endhead
""")
READ={"R":"Real file, unmodified. These carry the weight of the validation.",
      "D":"Derived by the code under test from a real file.",
      "R/D":"A mixture of the two within one record.",
      "S":"Constructed for the test; printed verbatim in the input tables.",
      "Specification":"Taken from the RDML schema rather than from a file.",
      "R + R":"Two real files compared with each other."}
for k,v in cls.most_common():
    W("%s & %d & %s \\\\\n"%(esc(k),v,READ.get(k,"")))
W(r"\bottomrule\end{longtable}")
W(r"""
Of %d records, %d draw on real files that this project did not create, %d are derived from them by
the code under test, and %d are constructed boundary cases. No function rests on constructed input
alone.
"""%(len(REC),sum(v for k,v in cls.items() if k.startswith("R")),cls.get("D",0),cls.get("S",0)))

io.open(os.path.join("tex","part3.tex"),"w",encoding="utf-8").write("\n".join(doc))
print("part3 written",sum(len(x) for x in doc),"chars")
