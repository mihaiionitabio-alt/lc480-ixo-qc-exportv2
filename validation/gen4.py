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
def code(t,style="js"): return "\\begin{lstlisting}[style=%s]\n%s\n\\end{lstlisting}\n"%(style,t.replace("\r",""))
doc=[];W=doc.append

W(r"\appendix")
W(r"\chapter{The capture harness}\label{app:harness}")
W(r"""
The harness is the instrument of this report. It drives a real browser, loads the build under test
from disk, feeds it the corpus, calls each function with the inputs described in
chapter~\ref{ch:functions}, and writes one JSON record per case. Every table and every figure in
this document is generated from that JSON; none of it was typed by hand.

Run it with the build and the corpus in place:
""")
W(code("node capture.cjs        # writes validation_data.json\npython3 gen.py gen2.py gen3.py gen4.py   # regenerates this document","plain"))
W(r"Complete source:")
W(code(io.open("capture.cjs",encoding="utf-8").read()))

# ---------------- A3 pages
W(r"\A3start")
W(r"\chapter{Fold-out: the reader in the page}\label{app:pipeline}")
W(r"""
\begin{center}\resizebox{0.98\linewidth}{!}{%
\begin{tikzpicture}[node distance=10mm]
\node[io] (file) {file chosen\\ by the operator};
\node[dec, right=13mm of file] (zip) {ZIP?};
\node[box, above right=6mm and 14mm of zip] (eds) {probe\\ \texttt{apldbio/sds/}\\\texttt{experiment.xml}};
\node[box, below right=6mm and 14mm of zip] (rdp) {probe\\ \texttt{rdml\_data.xml}\\ \fn{rdmlIsContainer}};
\node[box, right=14mm of eds] (edsk) {kind \texttt{eds}};
\node[box, right=14mm of rdp] (rdk) {kind \texttt{rdml}};
\node[box, right=14mm of edsk] (pe) {\fn{parseEds}\\ existing path};
\node[box, right=14mm of rdk] (pr) {\fn{rdmlEntries}\\ \fn{rdmlParse}\\ one run per \texttt{<run>}};
\node[box, right=16mm of $(pe)!0.5!(pr)$] (model) {the run model\\ wells, curves, melt,\\ plate, analyses, meta};
\node[box, below=11mm of model] (prio) {\fn{applyRawFilePriority}\\ vendor container wins};
\node[dec, below=11mm of prio] (gate) {\fn{sopProcessingApplicability}};
\node[ok, below left=10mm and 6mm of gate] (eval) {evaluated by\\ the laboratory profile};
\node[bad, below right=10mm and 6mm of gate] (na) {\textbf{Profile not applicable}\\ raw / third-party /\\ superseded};
\node[box, right=16mm of model] (views) {views, charts,\\ forensic scans,\\ exports};
\draw[fl] (file)--(zip);
\draw[fl] (zip)--node[lbl,above,pos=.3]{yes}(eds);
\draw[fl] (zip)--node[lbl,below,pos=.3]{yes}(rdp);
\draw[fl] (eds)--(edsk); \draw[fl] (rdp)--(rdk);
\draw[fl] (edsk)--(pe); \draw[fl] (rdk)--(pr);
\draw[fl] (pe)--(model); \draw[fl] (pr)--(model);
\draw[fl] (model)--(prio); \draw[fl] (prio)--(gate);
\draw[fl] (gate)--node[lbl,left]{instrument\\ vendor-export}(eval);
\draw[fl] (gate)--node[lbl,right]{raw, third-party,\\ superseded}(na);
\draw[fl] (model)--(views);
\end{tikzpicture}}\end{center}
\begin{center}\small Figure A: where the reader sits. The existing \texttt{.eds} path and the new
RDML path meet at the run model and are indistinguishable downstream, which is why every view,
chart and export works on an RDML file without knowing what it is.\normalsize\end{center}
""")

W(r"\chapter{Fold-out: \fn{rdmlParse} in full}\label{app:parse}")
W(r"""
\begin{center}\resizebox{0.99\linewidth}{!}{%
\begin{tikzpicture}[node distance=9mm]
\node[io] (xml) {\texttt{rdml\_data.xml}};
\node[box, right=11mm of xml] (dp) {\texttt{DOMParser}};
\node[dec, right=11mm of dp] (wf) {well formed?\\ root is \texttt{<rdml>}?};
\node[bad, above=8mm of wf] (er) {throw,\\ naming what was found};
\node[dec, right=12mm of wf] (ver) {version in\\ 1.0--1.4?};
\node[box, above=8mm of ver] (note) {\fn{appNotice}\\ read on as 1.4};
\node[box, right=12mm of ver] (dict) {dictionaries\\ \texttt{dye} $\rightarrow$ channel index\\ \texttt{sample} $\rightarrow$ type, role\\ \texttt{target} $\rightarrow$ type, dye, Tm};
\node[box, below=10mm of dict] (loopr) {for each\\ \texttt{<experiment>/<run>}};
\node[box, below=9mm of loopr] (fmt) {\texttt{<pcrFormat>}\\ rows $\times$ columns};
\node[box, right=13mm of fmt] (pass1) {\textbf{pass 1}\\ scan every \texttt{<adp>}\\ for the largest \texttt{cyc}\\ $\rightarrow$ cycle count};
\node[box, right=13mm of pass1] (pass2) {\textbf{pass 2}\\ for each \texttt{<react>}};
\node[dec, below=9mm of pass2] (inside) {react id inside\\ rows $\times$ columns?};
\node[bad, right=12mm of inside] (skip) {skip the reaction};
\node[box, below=9mm of inside] (data) {for each \texttt{<data>}};
\node[box, below=9mm of data] (adp) {\texttt{<adp>} sorted by \texttt{cyc}\\ $\rightarrow$ curve, amplitude};
\node[box, left=13mm of adp] (mdp) {\texttt{<mdp>} sorted by \texttt{tmp}\\ $\rightarrow$ melt series};
\node[dec, below=10mm of adp] (ceil) {cq $=$ cycle count\\ \emph{and} no N$_0$\\ \emph{and} no ampEff?};
\node[bad, right=13mm of ceil] (undet) {cq $\rightarrow$ null\\ \texttt{CpState} $=$ Undetermined\\ count the conversion};
\node[box, below=9mm of ceil] (well) {build the well\\ \texttt{CpRaw}, \texttt{cqSource},\\ \texttt{rdml}\{N$_0$, ampEff, excl, note\}};
\node[ok, left=14mm of well] (run) {run object\\ wells, allCurves, tmWells,\\ plate, analyses, protocol,\\ meta, integrity, experimentId};
\draw[fl] (xml)--(dp); \draw[fl] (dp)--(wf);
\draw[fl] (wf)--node[lbl,right]{no}(er);
\draw[fl] (wf)--node[lbl,above]{yes}(ver);
\draw[fl] (ver)--node[lbl,right]{no}(note);
\draw[fl] (ver)--node[lbl,above]{yes}(dict);
\draw[fl] (dict)--(loopr); \draw[fl] (loopr)--(fmt); \draw[fl] (fmt)--(pass1); \draw[fl] (pass1)--(pass2);
\draw[fl] (pass2)--(inside);
\draw[fl] (inside)--node[lbl,above]{no}(skip);
\draw[fl] (inside)--node[lbl,right]{yes}(data);
\draw[fl] (data)--(adp); \draw[fl] (data.west) -| (mdp.north);
\draw[fl] (adp)--(ceil); \draw[fl] (mdp.south) |- ([yshift=2mm]well.north west);
\draw[fl] (ceil)--node[lbl,above]{yes}(undet);
\draw[fl] (ceil)--node[lbl,right]{no}(well);
\draw[fl] (undet.south) |- ([yshift=-2mm]well.north east);
\draw[fl] (well)--(run);
\end{tikzpicture}}\end{center}
\begin{center}\small Figure B: \fn{rdmlParse}. The first pass exists only to establish the cycle
count, because the ceiling rule needs it before any well is built.\normalsize\end{center}
""")

W(r"\chapter{Fold-out: coverage matrix}\label{app:matrix}")
W(r"""
Which corpus file exercised which function. A dot marks at least one executed record.
""")
files=[c["file"] for c in D["corpus"]]
fns=[k for k in byfn.keys()]
def touches(fn,f):
    for r in byfn[fn]:
        blob=json.dumps([r.get("case"),r.get("inputDesc"),r.get("input")],ensure_ascii=False)
        if f in blob or f.replace(".rdml","") in blob: return True
    return False
short={f:("C%d"%(i+1)) for i,f in enumerate(files)}
W(r"\begin{center}\small\begin{tabular}{@{}p{46mm}"+ "c"*len(files) + r"@{}}")
W(r"\toprule \textbf{Function} & " + " & ".join(r"\textbf{%s}"%short[f] for f in files) + r" \\ \midrule")
for fn in fns:
    cells=[r"$\bullet$" if touches(fn,f) else r"\textcolor{gray}{--}" for f in files]
    W(r"\fn{%s} & %s \\"%(esc(fn)[:34]," & ".join(cells)))
W(r"\bottomrule\end{tabular}\end{center}")
W(r"\vspace{3mm}\begin{center}\small\begin{tabular}{@{}ll@{}}\toprule\textbf{Key}&\textbf{File}\\\midrule")
for f in files: W(r"%s & \texttt{%s} \\"%(short[f],esc(f)))
W(r"\bottomrule\end{tabular}\end{center}")
W(r"""
\vspace{4mm}
Functions with no dot in a column were exercised by constructed input only for that file; the input
tables in chapter~\ref{ch:functions} name every such case. Every function has at least one real-file
column, except the two that exist purely to normalise strings, whose real inputs are file names
rather than file contents.
""")

W(r"\chapter{Fold-out: the reader, complete}\label{app:source}")
W(r"""
The whole reader as it stands in the build under test, in production order: constants, container,
accessors, parser, state, gate, priority. Line numbers are those of the production file.
""")
order=["rdmlEntries","rdmlIsContainer","rdmlKids","rdmlKid","rdmlText","rdmlNum","rdmlAttrId",
       "RDML_SAMPLE_ROLE","rdmlParse","RDML_REANALYSIS_TOOLS","runProcessingState",
       "runIsInstrumentAnalysed","sopProcessingApplicability","rdmlStem","rdmlKeyOf",
       "applyRawFilePriority","runIsSuperseded"]
whole=[]
for n in order:
    s=SRC[n]
    whole.append("/* ---- %s  (production line %d) ---- */"%(n,s["line"]))
    if s.get("comment"): whole.append(s["comment"])
    whole.append(s["code"]); whole.append("")
W(r"\begin{multicols}{2}")
W(code("\n".join(whole),"jstiny"))
W(r"\end{multicols}")
W(r"\A3end")

W(r"\chapter{Machine-readable evidence}")
W(r"""
\texttt{validation\_data.json} holds every record printed in this document, with the full input and
output of each. Structure:
""")
W(code(json.dumps({"page":D["page"],"when":D["when"],"pageErrors":D["pageErrors"],
  "corpus":"[ {file, bytes, sha256} × %d ]"%len(D["corpus"]),
  "corpusRuns":D["corpusRuns"],
  "records":"[ {fn, case, inputDesc, inputProvenance, input, output, expect, pass, note?} × %d ]"%len(REC)},
  indent=1,ensure_ascii=False),"jstiny"))
io.open(os.path.join("tex","part4.tex"),"w",encoding="utf-8").write("\n".join(doc))
print("part4 written",sum(len(x) for x in doc),"chars")
