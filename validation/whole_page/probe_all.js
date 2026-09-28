() => {
  /* ------------------------------------------------------------------ *
   * Whole-page validation capture.
   * For every top-level function and constant in the production build,
   * record the exact arguments used, where each argument came from
   * (provenance class), the exact return value, whether global state
   * changed, and which side effects were attempted.
   * ------------------------------------------------------------------ */

  /* ---------- 0. neutralise side effects, count them ---------- */
  const side = { download: 0, objectUrl: 0, anchorClick: 0, print: 0, alert: 0 };
  const realDownload = window.download;
  if (typeof realDownload === 'function') window.download = () => { side.download++; };
  const realCreate = URL.createObjectURL;
  URL.createObjectURL = () => { side.objectUrl++; return 'blob:probe'; };
  const realClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { side.anchorClick++; };
  window.print = () => { side.print++; };
  window.alert = () => { side.alert++; };
  const sideSnap = () => ({ ...side });
  const sideDelta = (a, b) => { const d = {}; for (const k of Object.keys(b)) if (b[k] !== a[k]) d[k] = b[k] - a[k]; return d; };

  /* ---------- 1. the index ---------- */
  const src = [...document.querySelectorAll('script')].map(s => s.textContent).sort((a, b) => b.length - a.length)[0] || '';
  const declared = new Set();
  for (const m of src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) declared.add(m[1]);
  for (const m of src.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)) declared.add(m[1]);
  const ONLY = (globalThis.__PROBE_ONLY && globalThis.__PROBE_ONLY.length) ? new Set(globalThis.__PROBE_ONLY) : null;
  const SKIP = new Set(globalThis.__PROBE_SKIP || []);
  const index = [...declared].sort().filter(n => (!ONLY || ONLY.has(n)) && !SKIP.has(n));
  const missing = index.filter(n => { try { return typeof eval(n) === 'undefined'; } catch (e) { return true; } });

  /* ---------- 2. serialisation ---------- */
  const safe = (v, depth, arrCap) => {
    const seen = new WeakSet();
    const walk = (x, d) => {
      if (x === null) return null;
      const t = typeof x;
      if (t === 'function') return '<function ' + (x.name || 'anonymous') + '>';
      if (t !== 'object') return t === 'number' && !Number.isFinite(x) ? String(x) : x;
      if (seen.has(x)) return '<cycle>';
      if (d > (depth === undefined ? 4 : depth)) return '<deep>';
      if (x instanceof Node) return '<' + (x.nodeName || 'node').toLowerCase() + '>';
      if (x instanceof Map) return '<Map size=' + x.size + '>';
      if (x instanceof Set) return '<Set size=' + x.size + '>';
      if (ArrayBuffer.isView(x)) return '<' + x.constructor.name + ' length=' + x.length + '>';
      if (x instanceof ArrayBuffer) return '<ArrayBuffer byteLength=' + x.byteLength + '>';
      if (x instanceof Date) return x.toISOString();
      seen.add(x);
      if (Array.isArray(x)) {
        const cap = arrCap === undefined ? 12 : arrCap;
        const head = x.slice(0, cap).map(y => walk(y, d + 1));
        return x.length > cap ? head.concat(['…+' + (x.length - cap) + ' more']) : head;
      }
      const o = {}; const ks = Object.keys(x);
      for (const k of ks.slice(0, 24)) o[k] = walk(x[k], d + 1);
      if (ks.length > 24) o['…'] = (ks.length - 24) + ' more keys';
      return o;
    };
    try { return JSON.stringify(walk(v, 0)); } catch (e) { return '"<unserialisable: ' + e.message + '>"'; }
  };
  const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + ' …[' + s.length + ' chars total]' : s);
  const shape = v => v === undefined ? 'undefined' : v === null ? 'null'
    : Array.isArray(v) ? 'array[' + v.length + ']'
    : v instanceof Node ? 'DOM <' + v.nodeName.toLowerCase() + '>'
    : typeof v === 'object' ? 'object{' + Object.keys(v).length + ' keys}'
    : typeof v === 'string' ? 'string[' + v.length + ']'
    : typeof v;

  /* ---------- 3. fixtures, each with its provenance ---------- */
  /* R = a real instrument or exchange file, unmodified, decoded by the page's own intake
     D = derived by the code under test from an R input
     S = synthetic value written for this probe
     E = the live DOM of the page after the real files were loaded and every view rendered */
  const F = (v, prov, desc) => ({ v, prov, desc });

  const run   = (typeof RUNS !== 'undefined' && RUNS[0]) || null;
  const runName = run ? run.file : '(no run)';
  const well  = (run && (run.wells || [])[0]) || null;
  const curve = (well && well.curve) || (run && (Object.values(run.allCurves || {})[0] || {}).curve) || [1,1,1,2,4,8,16,32,48,52,53,53];
  const curveProv = (well && well.curve) ? 'R' : 'S';
  const inst  = (() => { try { return ccInstruments()[0]; } catch (e) { return null; } })();
  const ccRows = (() => { try { return inst ? ccRowsFor(inst.key) : []; } catch (e) { return []; } })();
  const ccDef  = (typeof CC_CHARTS !== 'undefined' && CC_CHARTS[0]) || null;
  const ccRes  = (() => { try { return ccDef && ccRows.length ? ccCompute(ccDef, ccRows, '') : null; } catch (e) { return null; } })();
  const ev     = (() => { try { return (reviewForensicEvents() || [])[0] || null; } catch (e) { return null; } })();
  const allEv  = (() => { try { return reviewForensicEvents() || []; } catch (e) { return []; } })();
  const sopEv  = (() => { try { return (sopEvaluateAll() || [])[0] || null; } catch (e) { return null; } })();
  const graph  = (typeof GRAPHS !== 'undefined' && GRAPHS[0]) || null;
  const nums   = [1,2,3,4,5,6,7,8,9,10];
  const series = [0,1,2,3,4,5,6,7,8,9];
  const cols2  = [{ key:'a', label:'A' }, { key:'b', label:'B' }];
  const rows2  = [{ a:1, b:2 }, { a:3, b:4 }];

  const R_RUN  = 'RUNS[0], the run model the page built from ' + runName;
  const BY_NAME = {
    run:F(run,'R',R_RUN), r:F(run,'R',R_RUN), experiment:F(run,'R',R_RUN),
    w:F(well,'R','RUNS[0].wells[0]'), well:F(well,'R','RUNS[0].wells[0]'),
    row:F(well,'R','RUNS[0].wells[0]'), rec:F(well,'R','RUNS[0].wells[0]'),
    x:F(1,'S','the number 1'), y:F(nums,'S','1..10'), v:F(1,'S','the number 1'), n:F(3,'S','the number 3'),
    rows:F(ccRows,'D','ccRowsFor(first instrument) — history rows derived from the loaded files'),
    all:F(ccRows,'D','ccRowsFor(first instrument)'), list:F(ccRows,'D','ccRowsFor(first instrument)'),
    arr:F(nums,'S','1..10'), a:F(nums,'S','1..10'), b:F(nums,'S','1..10'),
    values:F(nums,'S','1..10'), data:F(nums,'S','1..10'),
    curve:F(curve,curveProv,curveProv==='R'?'the fluorescence curve of RUNS[0].wells[0]':'a 12-point rising curve'),
    cur:F(curve,curveProv,'as curve'),
    pts:F((ccRes && ccRes.pts) || nums.map(v=>({y:v})),ccRes?'D':'S','points computed by ccCompute from the history rows'),
    def:F(ccDef,'S','CC_CHARTS[0], a chart definition declared in the page'),
    d:F(ccDef,'S','CC_CHARTS[0]'), chart:F(ccDef,'S','CC_CHARTS[0]'),
    cfg:F((()=>{try{return ccCfg(ccDef&&ccDef.id);}catch(e){return {};}})(),'D','ccCfg of that chart'),
    res:F(ccRes,'D','ccCompute(CC_CHARTS[0], history rows)'),
    result:F(ccRes,'D','ccCompute(CC_CHARTS[0], history rows)'),
    e:F(ev,'D','reviewForensicEvents()[0] — an event the page derived from the loaded files'),
    event:F(ev,'D','reviewForensicEvents()[0]'),
    events:F(allEv,'D','reviewForensicEvents() in full'),
    ev:F(sopEv,'D','sopEvaluateAll()[0] — a profile answer derived from the loaded files'),
    g:F(graph,'S','GRAPHS[0], a graph definition declared in the page'),
    c:F(graph?{g:graph,ri:0,run,target:'',metric:'outcome',signal:'stored',log:false,colourby:'outcome',level:'end',control:'0'}:null,'D','a chart context over GRAPHS[0] and RUNS[0]'),
    ctx:F(null,'S','null'),
    s:F('text','S','the string "text"'), str:F('text','S','the string "text"'), text:F('text','S','the string "text"'),
    name:F((run&&run.file)||'name','R','the file name of RUNS[0]'),
    title:F('title','S','the string "title"'), label:F('label','S','the string "label"'),
    key:F((inst&&inst.key)||'key','D','the key of the first instrument in the history'),
    id:F((ccDef&&ccDef.id)||'heat_rate','S','the id of CC_CHARTS[0]'),
    tab:F('review','S','the tab name "review"'), kind:F('review','S','"review"'),
    type:F('i','S','the string "i"'), mode:F('order','S','"order"'),
    sev:F('review','S','"review"'), severity:F('review','S','"review"'),
    pos:F((well&&well.pos)||0,'R','the plate position of RUNS[0].wells[0]'),
    channel:F((well&&well.channel)||0,'R','the channel of RUNS[0].wells[0]'),
    idx:F(0,'S','0'), i:F(0,'S','0'), index:F(0,'S','0'),
    cols:F((run&&run.cols)||12,'R','the plate width of RUNS[0]'),
    limit:F(0.5,'S','0.5'), step:F(1,'S','1'), ri:F(0,'S','0'),
    instrument:F((inst&&inst.key)||'','D','the first instrument key in the history'),
    variant:F('','S','the empty string'), target:F('','S','the empty string'), sample:F('','S','the empty string'),
    profile:F((typeof SOP!=='undefined'?SOP:null),'S','a deep copy of the active review profile'),
    sop:F((typeof SOP!=='undefined'?SOP:null),'S','a deep copy of the active review profile'),
    p:F((typeof SOP!=='undefined'?SOP:null),'S','a deep copy of the active review profile'),
    o:F({},'S','{}'), obj:F({},'S','{}'), opts:F({},'S','{}'), options:F({},'S','{}'),
    filter:F('','S','the empty string'), forExport:F(false,'S','false'), on:F(true,'S','true'), flag:F(true,'S','true'),
    dom:F(document,'E','the live document'), root:F(document,'E','the live document'), doc:F(document,'E','the live document'),
    el:F(document.body,'E','the live <body>'), an:F(document.body,'E','the live <body>'), node:F(document.body,'E','the live <body>'),
    b64:F('AAECAwQ=','S','base64 of the bytes 00 01 02 03 04'),
    bytes:F(new Uint8Array([0,1,2,3]),'S','the bytes 00 01 02 03'),
    buf:F(new ArrayBuffer(8),'S','an 8-byte buffer'),
    entries:F([],'S','[]'), zip:F({entries:[]},'S','{entries:[]}'),
    m:F(new Map([['k',1]]),'S','Map k->1'), map:F(new Map([['k',1]]),'S','Map k->1'), set:F(new Set(['k']),'S','Set{k}'),
    t:F(Date.now(),'S','the current time in ms'), time:F(Date.now(),'S','the current time in ms'), date:F(Date.now(),'S','the current time in ms'),
    f:F(x=>x,'S','the identity function'), fn:F(x=>x,'S','the identity function'), cb:F(x=>x,'S','the identity function'),
    push:F(()=>{},'S','a no-op'), note:F(()=>{},'S','a no-op'), task:F(null,'S','null'), fallback:F(null,'S','null'),
    html:F('<b>x</b>','S','the markup <b>x</b>'),
    groups:F([[1,2,3],[2,3,4]],'S','two small groups'), counts:F([1,2,3],'S','1,2,3'),
    win:F(5,'S','5'), min:F(1,'S','1'), slices:F(4,'S','4'),
    expo:F([1,1,1],'S','1,1,1'), bad:F([0,1,0],'S','0,1,0'), source:F('probe','S','"probe"'),
    j:F({schema:'qpcr-instrument-history/1',rows:[]},'S','an empty history document'),
    canvas:F((()=>{const c=document.createElement('canvas');c.width=900;c.height=520;return c;})(),'S','a blank 900x520 canvas'),
    cv:F((()=>{const c=document.createElement('canvas');c.width=900;c.height=520;return c;})(),'S','a blank 900x520 canvas'),
    force:F(false,'S','false')
  };
  ['profile','sop','p'].forEach(k => { if (BY_NAME[k].v && typeof structuredClone === 'function') { try { BY_NAME[k] = F(structuredClone(BY_NAME[k].v),'S',BY_NAME[k].desc); } catch (e) {} } });
  const NAMES = Object.keys(BY_NAME).sort((a,b) => b.length - a.length);

  const edsRun = (typeof RUNS!=='undefined' ? RUNS.find(r => r.eds) : null) || null;
  const R_EDS = edsRun ? ('the first run in RUNS whose source is an .eds container (' + edsRun.file + ')') : 'no .eds run loaded';
  const NEWCANVAS = () => { const c = document.createElement('canvas'); c.width = 900; c.height = 520; return c; };
  const CURVEWELLS = () => (run && (run.wells||[]).filter(w => (w.curve||[]).length).slice(0,8)) || [];
  const CURVEROWS = () => { try { return (reviewRisingCurves ? reviewRisingCurves() : []).slice(0,8); } catch (e) { return CURVEWELLS().map(w => ({ experiment:'e', channel:w.channel, curve:w.curve, well:w.well })); } };
  const FIX = (globalThis.__FIXTURES || { rdmlXml:'<rdml/>', rdmlName:'none', rdmlBytes:new Uint8Array(0) });

  const OVERRIDE = {
    analysisResults: () => [F({el:document.createElement('div')},'S','an analysis stub whose element holds no <obj> results'), F(12,'S','12')],
    applyRawFilePriority: () => [F((typeof RUNS!=='undefined'?RUNS:[]),'R','RUNS in full, as loaded from the corpus')],
    drawRisingCurveBundle: () => [F(NEWCANVAS(),'S','a blank 900x520 canvas'), F(CURVEROWS(),'D','rising-curve rows derived from the loaded runs')],
    drawTemperatureTrace: () => [F(NEWCANVAS(),'S','a blank 900x520 canvas'), BY_NAME.run],
    rdmlParse: () => [F(FIX.rdmlXml,'R','the rdml_data.xml of '+FIX.rdmlName+', decoded by the page'), F(FIX.rdmlName,'R','its file name'), F(FIX.rdmlBytes,'R','its bytes')],
    appTaskWrap: () => [F(['a'],'S','["a"]'), F(()=>{},'S','a no-op')],
    assignRoles: () => [F((typeof RUNS!=='undefined'?RUNS.slice(0,1):[]),'R','[RUNS[0]]')],
    ccC: () => [F([1,2,3,2,1],'S','a five-point series'), BY_NAME.cfg],
    ccP: () => [F([1,2,1],'S','three counts'), F([10,10,10],'S','three denominators'), BY_NAME.cfg],
    ccU: () => [F([1,2,1],'S','three counts'), F([10,10,10],'S','three denominators'), BY_NAME.cfg],
    ccPhase: () => [F([1,2,3,4,5],'S','1..5'), F(3,'S','3')],
    ccDynamic: () => [BY_NAME.run, (BY_NAME.ev.v ? BY_NAME.ev : F({rows:[],icMedian:null},'S','an evaluation with no control rows')), F((()=>{try{return forensicCounts();}catch(e){return {copied:new Map(),findings:new Map()};}})(),'D','forensicCounts() over the loaded runs')],
    qsExport: () => [F(FIX.edsDoc,'R','the decoded structure EDS.parseEds returned for '+FIX.edsName), F({},'S','{}')],
    qsTables: () => [F(FIX.edsDoc,'R','the decoded structure EDS.parseEds returned for '+FIX.edsName), F({},'S','{}')],
    qsInstrument: () => [F(FIX.edsDoc,'R','the decoded structure EDS.parseEds returned for '+FIX.edsName)],
    studyRows: () => [F(FIX.edsDoc,'R','the decoded structure EDS.parseEds returned for '+FIX.edsName)],
    ccThin: () => [F(series,'S','0..9 as x'), F(series,'S','0..9 as y'), F(4,'S','4')],
    ccPeakRates: () => [F(series,'S','0..9'), F(series,'S','0..9'), F(3,'S','3'), F(0.1,'S','0.1')],
    ccTransitions: () => [F(series,'S','0..9'), F(series,'S','0..9'), F([[0,1]],'S','one segment'), F(0.5,'S','0.5')],
    ccValue: () => [BY_NAME.def, F(ccRows[0]||{},'D','the first history row'), F('','S','the empty string')],
    ce: () => [F('div','S','"div"')],
    dosStamp: () => [F(new Date(),'S','the current date')],
    downloadCanvas: () => [F(document.createElement('canvas'),'S','a blank canvas'), F('probe.png','S','"probe.png"')],
    drawAmplificationCurves: () => [F(NEWCANVAS(),'S','a blank 900x520 canvas'), F(CURVEWELLS(),'R','the first eight wells of RUNS[0] that carry a curve'), F('stored','S','"stored"'), F(false,'S','false'), F({},'S','{}')],
    drawLeveyJennings: () => [F(document.createElement('canvas'),'S','a blank canvas'), F({points:[],mean:0,sd:1},'S','an empty chart')],
    edsDerived: () => [F((run&&run.eds)?run:{eds:{exp:{},plate:{}}},(run&&run.eds)?'R':'S',(run&&run.eds)?R_RUN:'a minimal stand-in'), F(()=>{},'S','a no-op')],
    edsEvents: () => [F((run&&run.eds)?run:{eds:{analysis:{}},wells:[]},(run&&run.eds)?'R':'S',(run&&run.eds)?R_RUN:'a minimal stand-in'), F(()=>{},'S','a no-op')],
    extent: () => [F(series,'S','0..9'), F(0.05,'S','0.05')],
    gByDate: () => [F(rows2,'S','two rows'), F(()=>run,'S','a resolver returning RUNS[0]')],
    makeXlsx: () => [F([{name:'S1',rows:[['A','B'],[1,2]]}],'S','a one-sheet workbook of two rows')],
    ownQuery: () => [F(document.body,'E','the live <body>'), F('div','S','"div"')],
    ownQueryAll: () => [F(document.body,'E','the live <body>'), F('div','S','"div"')],
    qsWorkbook: () => [F((run&&run.eds)?run:{eds:{plate:{wells:[]},exp:{}},wells:[]},(run&&run.eds)?'R':'S',(run&&run.eds)?R_RUN:'a minimal stand-in'), F({},'S','{}')],
    reviewDisplayFindings: () => [F((()=>{try{return reviewEventsWithoutIntegrity()||[];}catch(e){return [];}})(),'D','reviewEventsWithoutIntegrity()')],
    setSelectItems: () => [F(document.createElement('select'),'S','an empty <select>'), F([{value:'1',label:'one'}],'S','one item'), F(null,'S','null')],
    sopField: () => [F('Label','S','"Label"'), F('run.integrity','S','a field path'), F('text','S','"text"'), F({},'S','{}'), F('','S','the empty string')],
    sopSetPath: () => [F('notes','S','"notes"'), F('probe','S','"probe"')],
    sopTableEditor: () => [F(document.createElement('div'),'S','an empty <div>'), F(rows2,'S','two rows'), F(cols2,'S','two columns'), F('Add','S','"Add"'), F(()=>({}),'S','a factory')],
    svgPlot: () => [F({title:'probe',x:[0,10],y:[0,10],series:[{type:'line',data:series.map((v,i)=>[i,v])}]},'S','a ten-point line plot')],
    tTest: () => [F(series,'S','0..9'), F(series.map(v=>v+1),'S','0..9 shifted by 1'), F('two','S','"two"')],
    table: () => [F(cols2,'S','two columns'), F(rows2,'S','two rows'), F({},'S','{}')],
    toCSV: () => [F(cols2,'S','two columns'), F(rows2,'S','two rows')],
    westgardReview: () => [F(series.map(v=>({y:v})),'S','ten points'), F(0,'S','0'), F(1,'S','1')],
    readStagedCore: () => [F(null,'S','null')],
    makeStoredZip: () => [F([{name:'a.txt',data:new Uint8Array([65])}],'S','a one-entry archive')],
    base64ToBytes: () => [F('AAECAwQ=','S','base64 of 00 01 02 03 04')],
    localizeDOM: () => [F(document.body,'E','the live <body>'), F(false,'S','false')],
    validateHistoryBoundary: () => [F({schema:'qpcr-instrument-history/1',rows:[]},'S','an empty history document'), F('probe','S','"probe"')],
    selApplyCsv: () => [F(selCsvTemplate(),'D','the selection template the page writes, taken back unchanged')],
    selReadme: () => [F(selCatalogue().slice(0,3),'D','the first three catalogue items')],
    selTableBlock: () => [F(pdfDoc(),'D','a report document opened by the page'),
                          F((()=>{try{return allWellRows().slice(0,5);}catch(e){return [{a:1}];}})(),'R','five stored result rows'),
                          F('','S','no note')]
  };

  const EXCLUDE = {
    main:'entry point; re-runs the whole page',
    boot:'entry point; re-runs the whole page',
    init:'entry point; re-runs the whole page',
    setPhase:'mutates the lifecycle phase by design',
    ccImport:'replaces the instrument history by design',
    sopApply:'replaces the active profile by design',
    invalidateAnalysisCaches:'clears caches by design'
  };

  /* ---------- 4. mutation detection ---------- */
  const snapshot = () => safe({
    runs:(typeof RUNS!=='undefined'?RUNS.length:-1),
    wells:(typeof RUNS!=='undefined'?RUNS.reduce((n,r)=>n+((r.wells||[]).length),0):-1),
    cq:(typeof RUNS!=='undefined'?RUNS.flatMap(r=>(r.wells||[]).slice(0,40).map(w=>w.CpRaw)):[]),
    sop:(typeof SOP!=='undefined'?SOP:null),
    cc:(typeof CC_STATE!=='undefined'?{i:CC_STATE.instrument,f:CC_STATE.filter}:''),
    phase:(typeof APP_STATE!=='undefined'?APP_STATE.phase+'/'+APP_STATE.generation:''),
    pasted:(typeof PASTED!=='undefined'&&PASTED?(PASTED.rows||[]).length:-1)
  }, 6, 200);
  const clean = {
    sop:(typeof SOP!=='undefined'?structuredClone(SOP):null),
    cc:(typeof CC_STATE!=='undefined'?{...CC_STATE}:null),
    runs:(typeof RUNS!=='undefined'?RUNS.length:-1)
  };
  let tainted = false;
  const restore = () => {
    try {
      if (clean.sop && typeof SOP!=='undefined') { for (const k of Object.keys(SOP)) delete SOP[k]; Object.assign(SOP, structuredClone(clean.sop)); }
      if (clean.cc && typeof CC_STATE!=='undefined') Object.assign(CC_STATE, clean.cc, { cache:null });
    } catch (e) {}
    if (typeof RUNS!=='undefined' && RUNS.length !== clean.runs) tainted = true;
  };

  /* ---------- 5. probe ---------- */
  const out = [];
  /* Names declared inside a module IIFE are not addressable from the page scope.
     Those the module exports are probed through the module object; the rest are
     reported as private helpers, exercised only through their module's entry points. */
  const NS = [];
  for (const m of src.matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=\s*\(\s*\(\s*\)\s*=>/gm)) {
    try { const o = eval(m[1]); if (o && typeof o === 'object') NS.push({ name:m[1], obj:o }); } catch (e) {}
  }
  const viaNS = nm => { for (const n of NS) if (Object.prototype.hasOwnProperty.call(n.obj, nm)) return n; return null; };

  for (const nm of index) {
    let fn, reachedVia = 'page scope';
    try { fn = eval(nm); }
    catch (e) {
      const ns = viaNS(nm);
      if (ns) { fn = ns.obj[nm]; reachedVia = ns.name + '.' + nm; }
      else { out.push({ name:nm, klass:'private', detail:'declared inside a module closure; not addressable by name from the page scope, and not exported' }); continue; }
    }

    if (typeof fn !== 'function') {
      out.push({ name:nm, klass:'constant', reachedVia, kindOf:shape(fn),
                 value:clip(safe(fn, 4, 40), 4000),
                 detail: Array.isArray(fn) ? ('array of ' + fn.length) : typeof fn });
      continue;
    }
    if (EXCLUDE[nm]) { out.push({ name:nm, klass:'excluded', detail:EXCLUDE[nm] }); continue; }

    let params = [];
    try {
      const sig = Function.prototype.toString.call(fn).replace(/\/\*[\s\S]*?\*\//g,'');
      const m = sig.match(/^[^(]*\(([^)]*)\)/) || sig.match(/^\s*(?:async\s*)?([A-Za-z_$][\w$]*)\s*=>/);
      params = m ? String(m[1]||'').split(',').map(s=>s.trim().split(/[=:]/)[0].trim()).filter(Boolean) : [];
    } catch (e) { params = []; }

    let descs = [], unfilled = [], viaOverride = !!OVERRIDE[nm];
    if (viaOverride) { try { descs = OVERRIDE[nm](); } catch (e) { descs = []; } }
    else for (const raw of params) {
      if (raw.startsWith('...')) break;
      const key = raw.replace(/^\{|\}$/g,'').toLowerCase();
      const hit = NAMES.find(k=>k===key) || NAMES.find(k=>key.startsWith(k)||key.endsWith(k));
      if (hit && BY_NAME[hit].v !== null && BY_NAME[hit].v !== undefined) descs.push(BY_NAME[hit]);
      else { unfilled.push(raw); descs.push(F(undefined,'S','not supplied (undefined)')); }
    }
    if (!viaOverride && unfilled.length === params.length && params.length) {
      out.push({ name:nm, klass:'no-fixture', reachedVia, detail:'no fixture for: '+unfilled.join(', '), arity:fn.length, params:params.join(',') });
      continue;
    }

    const argRec = descs.map((D,i) => ({
      param: (viaOverride ? (params[i]||('arg'+(i+1))) : (params[i]||('arg'+(i+1)))),
      prov: D.prov, from: D.desc, shape: shape(D.v), value: clip(safe(D.v, 3, 8), 500)
    }));

    const before = snapshot(), sBefore = sideSnap();
    let klass, detail = '', outputShape = '', outputValue = '';
    try {
      const v = fn(...descs.map(D=>D.v));
      const after = snapshot();
      outputShape = shape(v);
      outputValue = clip(safe(v, 4, 10), 1200);
      if (after !== before) { klass='mutates'; detail='global state changed during a read-only probe'; restore(); }
      else klass='pass';
      if (unfilled.length) detail += (detail?'; ':'') + 'partial: '+unfilled.join(', ')+' not supplied';
    } catch (err) {
      if (snapshot() !== before) restore();
      klass = 'threw';
      outputShape = 'threw';
      outputValue = String((err && err.message) || err).slice(0,300);
      detail = unfilled.length ? ('unfilled: '+unfilled.join(', ')) : '';
    }
    out.push({ name:nm, klass, detail, reachedVia, arity:fn.length, params:params.join(','),
               viaOverride, args:argRec, outputShape, output:outputValue,
               sideEffects: sideDelta(sBefore, sideSnap()) });
  }

  if (typeof realDownload === 'function') window.download = realDownload;
  URL.createObjectURL = realCreate;
  HTMLAnchorElement.prototype.click = realClick;

  const tally = {}; out.forEach(o => tally[o.klass] = (tally[o.klass]||0)+1);
  const provTally = {};
  out.forEach(o => (o.args||[]).forEach(a => provTally[a.prov] = (provTally[a.prov]||0)+1));
  return { indexed:index.length, missingAtRuntime:missing, tally, provTally, side, tainted,
           runsLoaded:(typeof RUNS!=='undefined'?RUNS.length:-1), rows:out };
}
