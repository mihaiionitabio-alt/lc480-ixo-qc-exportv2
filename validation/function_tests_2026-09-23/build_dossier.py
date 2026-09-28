import html, json, re
from collections import Counter, defaultdict
from pathlib import Path
ROOT=Path(r'D:/IXO/release_unified_2026-09-21_r2/documentation/function_tests_2026-09-23')
DATA=json.loads((ROOT/'function_test_results.json').read_text(encoding='utf-8'))
E=DATA['results']

def clean(v,n=700):
    s='' if v is None else str(v).replace('\r',' ').replace('\n',' ')
    s=re.sub(r'\s+',' ',s).strip()
    return s if len(s)<=n else s[:n-1]+'…'
def md(v,n=700): return clean(v,n).replace('|','\\|')
def reason(e):
    if e.get('execStatus')=='PASS-executable': return 'Executed in an isolated browser harness.'
    if e.get('execStatus')=='REVIEW-runtime': return 'Generated probe input did not satisfy the runtime contract; targeted fixture required. Runtime: '+clean(e.get('execError',''),300)
    src=(e.get('input','')+' '+e.get('output','')+' '+e.get('role','')).lower()
    labels=[]
    for tok,label in [('run','decoded RUNS model'),('profile','SOP profile'),('history','instrument history rows'),('dom','live DOM fixture'),('file','file bytes/staged-file fixture'),('export','export/download fixture'),('canvas','canvas/SVG surface'),('state','populated application state')]:
        if tok in src and label not in labels: labels.append(label)
    return 'Requires '+(', '.join(labels) if labels else 'decoded runs, profile, history, DOM controls, file bytes or an export fixture')+'; no fabricated laboratory fixture was used.'
counts=Counter(e.get('execStatus','') for e in E); stat=Counter(e.get('staticStatus','') for e in E)
sha=DATA.get('htmlSha256', DATA.get('sha256','')); html_path=r'D:/IXO/release_unified_2026-09-21_r2/qpcr_qc_forensics.html'; idx_path=r'D:/IXO/release_unified_2026-09-21_r2/documentation/documentation_sources/generator/fnindex.json'
L=['# qPCR QC forensics — indexed function and constant verification dossier','', '**Scope.** Read-only verification of every entry in the current 571-entry HTML index. The application HTML, index, manual and stored data were not changed by this dossier build.','',f'- HTML: `{html_path}`',f'- HTML SHA-256 at verification: `{sha}`',f'- Index: `{idx_path}` ({len(E)} entries)','- Harness: `run_function_verification.cjs` using a headless browser; no network and no laboratory file writes.','', '## How to read the result','', 'Every row has the inferred required input, observed output contract, executable probe input when safe, result, and static relations to indexed symbols. `PASS-executable` means the symbol ran in an isolated page and returned without an exception. `REVIEW-fixture-required` means execution was withheld because a fabricated RUNS/profile/history/DOM/file/export fixture would be misleading; the required contract is recorded. `REVIEW-runtime` means the generated probe did not satisfy the runtime contract and is retained for targeted fixture testing. `PASS-static` means the indexed source range exists and matches the index; it is not a substitute for execution.','', '## Coverage summary','', '| Measure | Count |','|---|---:|',f'| Indexed entries processed | {len(E)} |']
for k in ['PASS-executable','REVIEW-fixture-required','REVIEW-runtime']: L.append(f'| {k} | {counts.get(k,0)} |')
for k in ['PASS-static','REVIEW-static']: L.append(f'| {k} | {stat.get(k,0)} |')
L += [f'| Browser page errors during harness run | {len(DATA.get("pageErrors",[]))} |','']
L.append('The harness captured **0 page errors**.' if not DATA.get('pageErrors') else 'Page errors: '+', '.join(map(str,DATA['pageErrors'])))
L += ['', '## Test records — all 571 indexed entries','', 'The table is one row per indexed function or constant. Line ranges refer to the HTML source.','', '| # | Symbol / kind | HTML lines | Layer | Required input | Probe input | Output observed/contract | Test result | Relations |','|---:|---|---:|---|---|---|---|---|---|']
for i,e in enumerate(E,1):
    res=e.get('execStatus','')+(': '+md(e.get('execError'),220) if e.get('execError') else '')
    refs=', '.join(e.get('refs',[])) or '—'
    L.append(f"| {i} | `{clean(e.get('name'),90)}`<br>{clean(e.get('kind'),34)} | {e.get('start','?')}–{e.get('end','?')} | {md(e.get('role'))} | {md(e.get('input'),250)} | {md(e.get('execInput'),180) or '—'} | {md(e.get('execOutput') or e.get('output'),420)} | **{res}**<br>{md(reason(e),300)} | {md(refs,260)} |")
L += ['', '## Interpretation and limitations','', 'The executable probes are conservative. Pure format/statistical helpers and constants can be checked with synthetic scalar/array values. Functions that draw, mutate controls, decode an experiment, evaluate the laboratory profile, build charts, or write exports require a coherent decoded run set and browser state; those rows are marked for fixture execution instead of being given invented values. This keeps the record auditable and does not alter stored Cq/Ct, calls, history, or exports.','', 'The complete relation map is in `function_call_map_full.dot`; the readable Mermaid overview is in `function_call_map.mmd`; module logic diagrams are in `function_logic_diagrams.md`.','', '## Reproduce','', 'From this folder, run the same Node harness and inspect `function_test_results.json`. It reads the current HTML and index, evaluates only in a temporary browser page, and writes no application files.','']
(ROOT/'function_test_report.md').write_text('\n'.join(L),encoding='utf-8')

def dq(s): return '"'+str(s).replace('\\','\\\\').replace('"','\\"').replace('\n',' ')+'"'
D=['digraph function_relations {','  rankdir=LR;','  graph [fontname=Arial, fontsize=10];','  node [shape=box, style=rounded, fontname=Arial, fontsize=8];']
for i,e in enumerate(E):
    col={'Client/view':'#dbeafe','Controller/service':'#dcfce7','Repository/data access':'#fef3c7','Shared model/utility':'#f3e8ff'}.get(e.get('role'),'#f3f4f6')
    lab=f"{e.get('name','')}\\n{e.get('kind','')}\\n{e.get('start','?')}–{e.get('end','?')}"
    D.append(f'  n{i} [label={dq(lab)}, fillcolor={dq(col)}, style=filled];')
by=defaultdict(list)
for i,e in enumerate(E): by[e.get('name','')].append(f'n{i}')
for i,e in enumerate(E):
    for ref in e.get('refs',[]):
        for t in by.get(ref,[]):
            if t!=f'n{i}': D.append(f'  n{i} -> {t};')
D.append('}')
(ROOT/'function_call_map_full.dot').write_text('\n'.join(D)+'\n',encoding='utf-8')
# Compact map with actual indexed names where found.
def pick(patterns):
    for p in patterns:
        for e in E:
            if re.search(p,e.get('name',''),re.I): return e.get('name')
    return None
def mid(s): return re.sub(r'[^A-Za-z0-9_]','_',s or 'missing')
intake=pick([r'^readStaged$',r'readStagedCore',r'^stageFiles$']); decode=pick([r'^decodeIxo$',r'^decodeEds$',r'decode.*Ixo',r'decode.*Eds']); assign=pick([r'assignRoles',r'resolve.*Role']); sop=pick([r'sopEvaluateRun',r'evaluate.*Profile',r'profile.*Applic']); review=pick([r'reviewForensicEventsCoreUncached',r'reviewForensic',r'risingCurveRows']); rows=pick([r'ccRowsFromRuns',r'control.*Rows']); comp=pick([r'^ccCompute$',r'cc.*Compute']); render=pick([r'^renderTab$',r'render.*Tab']); bundle=pick([r'^bundleZip$',r'bundle.*Zip',r'write.*Zip'])
M=['flowchart LR','  files[(Staged .ixo / .eds / .zip files)]','  runs[(Decoded RUNS model)]','  profile[(SOP profile and procedure)]','  history[(Instrument history)]','  findings[(Review events and rising-curve evidence)]','  chartrows[(Control-chart rows)]','  limits[(Limits, signals and baseline state)]','  views[[Tabs and console views]]','  exports[(CSV / ZIP / RDES / RDML / qPCR exports)]']
for lab,name in [('intake',intake),('decode',decode),('assign',assign),('sop',sop),('review',review),('ccrows',rows),('cccompute',comp),('render',render),('bundle',bundle)]: M.append(f'  {mid(lab)}["{name or lab}"]')
M += [f'  files --> {mid("intake")}',f'  {mid("intake")} --> {mid("decode")}',f'  {mid("decode")} --> runs',f'  runs --> {mid("assign")}',f'  profile --> {mid("sop")}',f'  runs --> {mid("sop")}',f'  {mid("sop")} --> views',f'  runs --> {mid("review")}',f'  {mid("review")} --> findings',f'  history --> {mid("ccrows")}',f'  runs --> {mid("ccrows")}',f'  {mid("ccrows")} --> chartrows',f'  chartrows --> {mid("cccompute")}',f'  {mid("cccompute")} --> limits','  limits --> views','  findings --> views','  runs --> exports','  findings --> exports',f'  {mid("bundle")} --> exports',f'  views --> {mid("render")}','  classDef data fill:#e0f2fe,stroke:#0369a1;','  class files,runs,profile,history,findings,chartrows,limits,exports data;']
(ROOT/'function_call_map.mmd').write_text('\n'.join(M)+'\n',encoding='utf-8')
logic=['# Logical flow diagrams for the indexed HTML','', 'These diagrams describe the current page as indexed; they are documentation only. Names in backticks are selected from the 571-entry index when present.','', '## 1. Intake and decoding','', '```mermaid','flowchart TD',f'  A[Select or stage files] --> B[`{intake or "readStaged"}`]',f'  B --> C[`{decode or "decodeIxo / decodeEds"}`]',f'  C --> D[`{assign or "assignRoles"}`]','  D --> E[RUNS and integrity metadata]','  E --> F[Ready state or contained error]','```','', 'Input: staged file objects/bytes and generation token. Output: decoded run records, stored values, integrity metadata and notices. A malformed file or cancelled generation terminates the operation cleanly without replacing an existing complete data set.','', '## 2. SOP procedure and interpretation','', '```mermaid','flowchart TD','  A[Decoded run and assay context] --> B[Profile applicability]',f'  B --> C[`{sop or "SOP/profile evaluation"}`]','  C --> D[Procedure checks: targets, controls, replicates, Cq/Ct windows]','  D --> E[Interpretation with rule id and profile version]','  E --> F[Result state: accepted, review or unresolved]','```','', 'Input: decoded targets, roles, stored Cq/Ct/calls, profile rules and procedure version. Output: rule-attributed criteria and calls; stored instrument values remain unchanged.','', '## 3. Review, forensic evidence and rising curves','', '```mermaid','flowchart TD','  A[RUNS: curves + stored result rows] --> B[Per-channel result linkage]',f'  B --> C[`{review or "reviewForensicEvents"}`]','  C --> D[Structural, recovery and review events]','  A --> E[Rising trace without same-channel result]','  E --> F[Evidence: experiment, well, channel, Cq/Ct if present]','  D --> G[Review overview and detailed sheets]','  F --> G','```','', 'Input: well/channel curves and only same-channel stored results. Output: deduplicated overview plus raw event log; a rising curve is not silently discarded because another channel has a result.','', '## 4. Control-chart computation','', '```mermaid','flowchart TD','  A[RUNS + instrument history] --> B[Grouping by assay/instrument/material/date]',f'  B --> C[`{rows or "ccRowsFromRuns"}`]',f'  C --> D[`{comp or "ccCompute"}`]','  D --> E[Centre, control limits, specification and pattern signals]','  E --> F[Control panel, CSV and chart image]','```','', 'Input: numeric metric rows, grouping identity, baseline policy and chart options. Output: plotted values, limits, signals and explicit no-baseline states.','', '## 5. Views, console and exports','', '```mermaid','flowchart LR','  S[State store] --> R[`'+(render or 'renderTab')+'`]', '  R --> V[Load, SOP, Results, Control panel, Graphs, Review, Formats, File integrity]', '  S --> X[Export builders]', '  X --> Z[`'+(bundle or 'bundleZip')+'`]', '  Z --> O[Downloadable tables and archive]', '```','', 'Input: stable state snapshot and selected view/options. Output: contained DOM render and deterministic download bytes. Rendering errors are isolated to the view and reported in the status bar.','', '## Relation semantics','', 'The full DOT graph contains one node for every indexed entry and an edge when a function source names another indexed symbol. It is a static relation map, not a claim that every branch executes in one session. Runtime status is in `function_test_report.md` and `function_test_results.json`.', '']
(ROOT/'function_logic_diagrams.md').write_text('\n'.join(logic),encoding='utf-8')
# Browser-readable searchable report.
tr=[]
for i,e in enumerate(E,1):
    res=e.get('execStatus','')+(': '+clean(e.get('execError'),240) if e.get('execError') else '')
    cells=[str(i),f"<code>{html.escape(str(e.get('name','')))}</code><br>{html.escape(str(e.get('kind','')))}",f"{e.get('start','?')}–{e.get('end','?')}",html.escape(str(e.get('role',''))),html.escape(clean(e.get('input'),320)),html.escape(clean(e.get('execInput'),220) or '—'),html.escape(clean(e.get('execOutput') or e.get('output'),480)),f"<b>{html.escape(res)}</b><br><small>{html.escape(reason(e))}</small>",html.escape(', '.join(e.get('refs',[])) or '—')]
    tr.append('<tr>'+''.join('<td>'+c+'</td>' for c in cells)+'</tr>')
H="""<!doctype html><meta charset='utf-8'><title>qPCR function verification dossier</title><style>body{font:14px system-ui,Segoe UI,sans-serif;margin:24px;color:#172033}h1{font-size:24px}table{border-collapse:collapse;width:100%%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px;vertical-align:top}th{position:sticky;top:0;background:#e2e8f0}input{padding:8px;width:420px;max-width:90%%}</style><h1>qPCR QC forensics — 571-entry verification dossier</h1><p>Read-only report for the current HTML. Filter the complete audit table; see the Markdown report and Mermaid/DOT files beside this page for explanations and diagrams.</p><p><b>Executable passes:</b> %d &nbsp; <b>Fixture reviews:</b> %d &nbsp; <b>Runtime reviews:</b> %d &nbsp; <b>Page errors:</b> %d</p><input id='q' placeholder='Filter by name, layer, result, input or relation' oninput='f()'><table><thead><tr><th>#</th><th>Symbol / kind</th><th>HTML lines</th><th>Layer</th><th>Required input</th><th>Probe input</th><th>Output</th><th>Result / reason</th><th>Relations</th></tr></thead><tbody id='b'>%s</tbody></table><script>function f(){let q=document.getElementById('q').value.toLowerCase();for(let r of document.querySelectorAll('#b tr'))r.hidden=!r.textContent.toLowerCase().includes(q)}</script>"""%(counts.get('PASS-executable',0),counts.get('REVIEW-fixture-required',0),counts.get('REVIEW-runtime',0),len(DATA.get('pageErrors',[])),'\n'.join(tr))
(ROOT/'function_test_report.html').write_text(H,encoding='utf-8')
print({'entries':len(E),'counts':dict(counts),'static':dict(stat),'pageErrors':len(DATA.get('pageErrors',[]))})
