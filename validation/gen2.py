# -*- coding: utf-8 -*-
import io, json, collections, os
D = json.load(open("validation_data.json")); SRC = json.load(open("prod_functions.json"))
REC = D["records"]
byfn = collections.OrderedDict()
for r in REC: byfn.setdefault(r["fn"], []).append(r)

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

def code(t, style="js"): return "\\begin{lstlisting}[style=%s]\n%s\n\\end{lstlisting}\n" % (style, t.replace("\r",""))
def jd(v, w=100):
    s = json.dumps(v, indent=1, ensure_ascii=False); out=[]
    for line in s.split("\n"):
        while len(line) > w:
            cut = line.rfind(" ", 0, w); cut = cut if cut > 40 else w
            out.append(line[:cut]); line = "   " + line[cut:].lstrip()
        out.append(line)
    return "\n".join(out)
def verdict(rs): return r"\PASS" if all(r["pass"] for r in rs) else r"\FAILED"

INFO = {
"rdmlEntries": dict(order="F1", title="Open the container",
 why=r"""An RDML file is a ZIP archive holding a single XML document. This function is the only
door into the format, and it deliberately does no work of its own: it delegates to \fn{readZip},
the reader the page already uses for QuantStudio containers, which verifies the CRC-32 of every
entry and refuses any compression method it does not implement. Reusing it means an RDML file gets
exactly the same container-level scrutiny as a vendor file, and that a corrupt archive fails at the
door rather than halfway through a parse.""",
 how=r"""Every file of the corpus was passed in as an \texttt{ArrayBuffer}. The check is that
exactly one entry comes back, that it is named \texttt{rdml\_data.xml}, and that \fn{readZip}
reports its CRC-32 as verified. A negative case is not possible at this level: a container that is
not a ZIP throws inside \fn{readZip} before this function returns."""),
"rdmlIsContainer": dict(order="F2", title="Decide whether this archive is an RDML file",
 why=r"""Intake must tell an RDML file from a QuantStudio file, and both are ZIP archives with the
same extension possibilities. The discriminator is the entry name, not the file name, so a renamed
file is still recognised and a file that merely ends in \texttt{.rdml} is not trusted.""",
 how=r"""One positive case from the corpus and two negative ones: the entry names of a QuantStudio
container, and an empty list. The negatives are class~S because no corpus file produces them
naturally at this point."""),
"rdmlKids": dict(order="F3", title="Child elements by local name",
 why=r"""RDML files in the wild are written with and without a default namespace prefix, and the
four minor versions differ only in optional elements. Matching on \texttt{localName} makes the
reader indifferent to both. This function is the foundation of every other accessor.""",
 how=r"""Five positive cases drawn from the reference document, chosen so that the expected counts
are known independently: a \texttt{<run>} has 96 \texttt{<react>} children and exactly one
\texttt{<pcrFormat>}; a \texttt{<react>} has two \texttt{<data>}; a \texttt{<data>} has 40
\texttt{<adp>} on a 40-cycle run. One absent-name case and one null-host case cover the
boundaries."""),
"rdmlKid": dict(order="F4", title="First child element by local name", why=r"""A convenience over
\fn{rdmlKids} for the elements the schema allows only once.""",
 how=r"""Present and absent, on the reference \texttt{<run>}."""),
"rdmlText": dict(order="F5", title="Trimmed text of a child element",
 why=r"""Most provenance fields are plain text: the instrument name, the collection software, the
background determination method, the Cq detection method. This accessor returns the empty string
for an absent element so that callers need no null handling.""",
 how=r"""Four elements of the reference \texttt{<run>} whose values can be read directly from the
file, plus an absent name. This is where finding~V-1 was raised: see section~\ref{sec:V1}."""),
"rdmlNum": dict(order="F6", title="Numeric text of a child element",
 why=r"""Cycle numbers are written \texttt{1.0}, fluorescence ranges from 0.956 to 263\,682.75, and
$N_0$ is written in exponent form. Everything numeric is therefore parsed as a float, and anything
that is not a finite number becomes \texttt{null} rather than \texttt{NaN} or zero --- the
distinction that the page's own \fn{resultCq} rule depends on.""",
 how=r"""Four strings taken verbatim from the corpus, covering the four spellings that actually
occur, and four constructed strings for the boundaries: empty, non-numeric, negative, and absent."""),
"rdmlAttrId": dict(order="F7", title="The \\texttt{id} attribute of a child element",
 why=r"""RDML links reactions to samples and targets by an \texttt{id} attribute on a child element
rather than by text content.""",
 how=r"""Both real uses --- \texttt{<react><sample id>} and \texttt{<data><tar id>} --- and an
absent name."""),
"rdmlParse": dict(order="F8", title="The document to the run model",
 why=r"""This is the reader. It turns one RDML document into one run object per \texttt{<run>}
element, in the shape the rest of the page already consumes: wells, curves, melting series, a plate
map, analyses, protocol channels, metadata and an integrity record. Everything downstream --- the
views, the charts, the exports, the forensic scans --- then works on an RDML file without knowing
that it is one.""",
 how=r"""Every file of the corpus, all 15 runs. Two structural invariants are asserted on every run:
every reaction lands inside the plate declared by \texttt{<pcrFormat>}, and every curve has either
no points or exactly as many points as the run has cycles. Three malformed documents test the error
path. The Cq ceiling rule and the cross-format oracle have their own sections."""),
"runProcessingState": dict(order="F9", title="Who analysed this run, if anyone",
 why=r"""The page reports what the instrument's producer concluded. An RDML file may carry the
producer's analysis, another tool's analysis, or no analysis at all, and the three cases must be
told apart before any verdict is issued. The discriminators are read from the file: a named
instrument, a named re-analysis method, and whether any crossing point exists at all.""",
 how=r"""One run of each of the four states, each taken from a different real file, plus a null
argument. The states are not asserted from the file names: the inputs table prints the three fields
the decision is actually made on."""),
"runIsInstrumentAnalysed": dict(order="F10", title="Shorthand for the two in-scope states",
 why=r"""Used by callers that only need the boolean.""",
 how=r"""The truth table over all four states."""),
"sopProcessingApplicability": dict(order="F11", title="The profile gate",
 why=r"""The laboratory profile may only be applied to a run the producer's software analysed. This
function is asked before the existing method-applicability test, because a file nobody analysed is
out of scope whatever the method says. Its return shape is the one \fn{sopEvaluateRun} already
consumes, so the existing code turns it into \emph{Profile not applicable --- reason} with no
further change.""",
 how=r"""All four states, plus the superseded case, which can only arise after
\fn{applyRawFilePriority} has run and is therefore tested in section~\ref{sec:priority}."""),
"rdmlStem": dict(order="F12", title="Normalise a file name for comparison",
 why=r"""An export is normally named after the run it came from, but with a different extension and
sometimes with separators changed. Comparing stems lets the priority rule recognise the pair.""",
 how=r"""The two real names of the reference pair, a constructed name with a double space and an
underscore, and the empty string."""),
"rdmlKeyOf": dict(order="F13", title="Identity keys for a loaded item",
 why=r"""Produces the keys on which the priority rule matches: the file stem and the experiment
identifier.""",
 how=r"""The reference pair and an item with no experiment identifier. Finding~V-2 was raised here;
section~\ref{sec:V2} explains why it was cleared."""),
"applyRawFilePriority": dict(order="F14", title="The instrument's own file wins",
 why=r"""When the same experiment is loaded as a vendor container and as an RDML export, the vendor
file is the record. The export is not discarded --- it is marked as superseded and kept, so the two
can be compared, which is a forensic check in its own right.""",
 how=r"""The reference pair loaded together; the same pair with the export renamed so that only the
experiment identifier can match; and a set of RDML runs with no vendor container at all, which must
supersede nothing."""),
"runIsSuperseded": dict(order="F15", title="Has this run been superseded",
 why=r"""One predicate, so that the gate and the views ask the same question.""",
 how=r"""The same run objects before and after the priority pass."""),
"RDML_SAMPLE_ROLE": dict(order="C1", title="Sample type to role",
 why=r"""RDML declares six sample types. They are mapped to the role vocabulary the page already
uses for control recognition, so an imported control is recognised by the same rules as a decoded
one.""", how=r"""The mapping is printed in full and its completeness against the schema is
asserted."""),
"RDML_REANALYSIS_TOOLS": dict(order="C2", title="Recognising a re-analysis",
 why=r"""Decides whether a named method belongs to a third-party tool. A false positive would put a
producer's analysis out of scope; a false negative would let another tool's numbers be treated as
the instrument's.""",
 how=r"""The four strings that actually occur in the corpus, verbatim, plus three tool names from
the RDML literature and the empty string."""),
}

DIAG = {
"rdmlEntries": r"""
\begin{center}\resizebox{0.96\linewidth}{!}{%
\begin{tikzpicture}[node distance=7mm]
\node[io] (ab) {ArrayBuffer\\ of the .rdml file};
\node[box, right=10mm of ab] (rz) {\fn{readZip}\\ central directory scan};
\node[dec, right=10mm of rz] (m) {method\\ 0 or 8?};
\node[bad, right=12mm of m] (th) {throw\\ unsupported\\ compression};
\node[dec, below=9mm of m] (crc) {CRC-32\\ matches?};
\node[bad, right=12mm of crc] (th2) {throw\\ CRC mismatch};
\node[ok, below=9mm of crc] (out) {entries[]\\ name, bytes,\\ zip.crcVerified};
\draw[fl] (ab)--(rz); \draw[fl] (rz)--(m);
\draw[fl] (m)--node[lbl,above]{no}(th);
\draw[fl] (m)--node[lbl,right]{yes}(crc);
\draw[fl] (crc)--node[lbl,above]{no}(th2);
\draw[fl] (crc)--node[lbl,right]{yes}(out);
\end{tikzpicture}}\end{center}
\begin{center}\small Figure: the container path. Nothing of the RDML format is looked at until the
archive itself is proven intact.\normalsize\end{center}
""",
"runProcessingState": r"""
\begin{center}\resizebox{0.98\linewidth}{!}{%
\begin{tikzpicture}[node distance=8mm]
\node[io] (r) {run object};
\node[dec, right=11mm of r] (d1) {has\\ \fn{rdmlDoc}?};
\node[ok, above right=4mm and 13mm of d1] (inst) {\textbf{instrument}\\ vendor container};
\node[dec, below right=4mm and 13mm of d1] (d2) {any reaction\\ with a Cq?};
\node[bad, right=13mm of d2] (raw) {\textbf{raw}\\ nobody analysed it};
\node[dec, below=10mm of d2] (d3) {re-analysis tool\\ named in\\ \fn{ampEffMet} or\\ background method?};
\node[bad, right=13mm of d3] (tp) {\textbf{third-party}\\ another tool's\\ numbers};
\node[dec, below=10mm of d3] (d4) {an instrument\\ is named?};
\node[ok, right=13mm of d4] (ve) {\textbf{vendor-export}\\ the producer's\\ own analysis};
\node[bad, below=9mm of d4] (tp2) {\textbf{third-party}\\ no instrument named};
\draw[fl] (r)--(d1);
\draw[fl] (d1)--node[lbl,above,pos=.35]{no}(inst);
\draw[fl] (d1)--node[lbl,below,pos=.35]{yes}(d2);
\draw[fl] (d2)--node[lbl,above]{none}(raw);
\draw[fl] (d2)--node[lbl,right]{some}(d3);
\draw[fl] (d3)--node[lbl,above]{yes}(tp);
\draw[fl] (d3)--node[lbl,right]{no}(d4);
\draw[fl] (d4)--node[lbl,above]{yes}(ve);
\draw[fl] (d4)--node[lbl,right]{no}(tp2);
\end{tikzpicture}}\end{center}
\begin{center}\small Figure: the state decision. Each test reads a field of the file, never the
file name.\normalsize\end{center}
""",
"applyRawFilePriority": r"""
\begin{center}\resizebox{0.95\linewidth}{!}{%
\begin{tikzpicture}[node distance=8mm]
\node[io] (all) {all loaded runs};
\node[box, right=11mm of all] (split) {split:\\ vendor vs RDML};
\node[dec, right=11mm of split] (any) {both kinds\\ present?};
\node[ok, above right=3mm and 12mm of any] (ret) {return unchanged\\ nothing superseded};
\node[box, below right=3mm and 12mm of any] (keys) {build key set\\ from vendor runs\\ (stem, experiment)};
\node[box, below=9mm of keys] (loop) {for each RDML run:\\ any key in the set?};
\node[bad, right=13mm of loop] (sup) {mark superseded\\ record which file\\ and why};
\node[ok, below=9mm of loop] (out) {\{runs, superseded\}\\ nothing discarded};
\draw[fl] (all)--(split); \draw[fl] (split)--(any);
\draw[fl] (any)--node[lbl,above,pos=.35]{no}(ret);
\draw[fl] (any)--node[lbl,below,pos=.35]{yes}(keys);
\draw[fl] (keys)--(loop);
\draw[fl] (loop)--node[lbl,above]{yes}(sup);
\draw[fl] (loop)--node[lbl,right]{no}(out);
\draw[fl] (sup.south) |- ([yshift=-3mm]out.north east);
\end{tikzpicture}}\end{center}
\begin{center}\small Figure: the priority pass. It marks; it never removes.\normalsize\end{center}
""",
}

doc = []; W = doc.append
W(r"\chapter{Function by function}\label{ch:functions}")
W(r"""
Every section below has the same five parts: what the function is for, its complete source as it
stands in the build under test, the inputs it was given with their provenance, what it returned,
and the verdict. Line numbers in the source listings are the line numbers of the production file.
""")

order = ["rdmlEntries","rdmlIsContainer","rdmlKids","rdmlKid","rdmlText","rdmlNum","rdmlAttrId",
         "rdmlParse","runProcessingState","runIsInstrumentAnalysed","sopProcessingApplicability",
         "rdmlStem","rdmlKeyOf","applyRawFilePriority","runIsSuperseded",
         "RDML_SAMPLE_ROLE","RDML_REANALYSIS_TOOLS"]

for name in order:
    info = INFO[name]; recs = byfn.get(name, [])
    if name == "rdmlParse":
        recs = [r for r in recs if r["fn"] == "rdmlParse"]
    W(r"\clearpage")
    W(r"\section{%s\quad\fn{%s} --- %s}" % (info["order"], esc(name), info["title"]))
    W(r"\label{sec:%s}" % name)
    W(r"\subsection*{Purpose}"); W(info["why"])
    W(r"\subsection*{Source, as built}")
    s = SRC.get(name)
    if s:
        W(r"Production file, line %d onwards; %d lines." % (s["line"], s["code"].count("\n") + 1))
        if s.get("comment"):
            W(r"The comment block that precedes it in the source:")
            W(code(s["comment"], "jstiny"))
        W(code(s["code"]))
    W(r"\subsection*{How it was validated}"); W(info["how"])
    if name in DIAG: W(DIAG[name])
    # input table
    W(r"\subsection*{Inputs}")
    W(r"""\begin{longtable}{@{}p{34mm}p{8mm}p{\dimexpr\linewidth-34mm-8mm-12pt\relax}@{}}
\toprule\textbf{Case} & \textbf{Cls} & \textbf{Input, and where it came from} \\ \midrule\endhead
""")
    for r in recs:
        cls = str(r.get("inputProvenance", "")).split(" ")[0]
        W("\\small %s & %s & %s\\newline {\\ttfamily\\scriptsize %s} \\\\\n\\addlinespace\n" % (
            escb(r["case"][:120]), esc(cls), escb(r["inputDesc"]),
            escb(json.dumps(r["input"], ensure_ascii=False)[:520])))
    W(r"\bottomrule\end{longtable}")
    # output table
    W(r"\subsection*{Outputs and verdicts}")
    big = [r for r in recs if len(json.dumps(r["output"], ensure_ascii=False)) > 420]
    small = [r for r in recs if r not in big]
    if small:
        W(r"""\begin{longtable}{@{}p{34mm}p{\dimexpr\linewidth-34mm-44mm-12pt\relax}p{30mm}p{10mm}@{}}
\toprule\textbf{Case} & \textbf{Returned} & \textbf{Expected} & \\ \midrule\endhead
""")
        for r in small:
            W("\\small %s & {\\ttfamily\\scriptsize %s} & \\small %s & %s \\\\\n\\addlinespace\n" % (
                escb(r["case"][:110]), escb(json.dumps(r["output"], ensure_ascii=False)[:420]),
                escb(r["expect"][:200]), r"\PASS" if r["pass"] else r"\FAILED"))
        W(r"\bottomrule\end{longtable}")
    for r in big:
        W(r"\subsubsection*{Returned value --- case \texttt{%s}}" % escb(r["case"]))
        W(r"Expected: %s \hfill Verdict: %s" % (esc(r["expect"]), r"\PASS" if r["pass"] else r"\FAILED"))
        W(code(jd(r["output"]), "jstiny"))
    notes = [r for r in recs if r.get("note")]
    if notes:
        W(r"\subsection*{Observations}")
        for r in notes:
            W(r"\textbf{%s.} %s" % (escb(r["case"][:90]), escb(r["note"])))
    W(r"\subsection*{Verdict}")
    W(r"%d case(s) executed, %d passed. Overall: %s" % (
        len(recs), sum(1 for r in recs if r["pass"]), verdict := (r"\PASS" if all(r["pass"] for r in recs) else r"\FAILED")))

io.open(os.path.join("tex", "part2.tex"), "w", encoding="utf-8").write("\n".join(doc))
print("part2 written", sum(len(x) for x in doc), "chars")
