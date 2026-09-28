() => {

    /* ---------- 0. neutralise side effects, count them ---------- */
    const side = { download: 0, objectUrl: 0, anchorClick: 0, print: 0, alert: 0 };
    const realDownload = window.download;
    if (typeof realDownload === 'function') window.download = (...a) => { side.download++; return undefined; };
    const realCreate = URL.createObjectURL;
    URL.createObjectURL = () => { side.objectUrl++; return 'blob:probe'; };
    const realClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { side.anchorClick++; };
    window.print = () => { side.print++; };
    window.alert = () => { side.alert++; };

    /* ---------- 1. the index: what is actually reachable at runtime ---------- */
    const src = [...document.querySelectorAll('script')].map(s => s.textContent).sort((a, b) => b.length - a.length)[0] || '';
    const declared = new Set();
    /* Column 0 only. A leading-whitespace-tolerant regex sweeps up every block-scoped
       local inside every function body: on this page that inflates the index from 571 to
       1298, and 734 of those never exist at runtime. The denominator has to be the set of
       TOP-LEVEL declarations, which is what the page actually exposes. */
    for (const m of src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) declared.add(m[1]);
    for (const m of src.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)) declared.add(m[1]);
    /* Phase 2 re-runs one name in a page of its own; see the isolation note below. */
    const ONLY = (globalThis.__PROBE_ONLY && globalThis.__PROBE_ONLY.length) ? new Set(globalThis.__PROBE_ONLY) : null;
    const index = [...declared].sort().filter(n => !ONLY || ONLY.has(n));
    const missing = index.filter(n => { try { return typeof eval(n) === 'undefined'; } catch (e) { return true; } });

    /* ---------- 2. live fixtures, taken from the loaded state ---------- */
    const run   = (typeof RUNS !== 'undefined' && RUNS[0]) || null;
    const well  = run && (run.wells || [])[0] || null;
    const curve = (well && well.curve) || (run && Object.values(run.allCurves || {})[0] || {}).curve || [1,1,1,2,4,8,16,32,48,52,53,53];
    const inst  = (() => { try { return ccInstruments()[0]; } catch (e) { return null; } })();
    const ccRows = (() => { try { return inst ? ccRowsFor(inst.key) : []; } catch (e) { return []; } })();
    const ccDef  = (typeof CC_CHARTS !== 'undefined' && CC_CHARTS[0]) || null;
    const ccRes  = (() => { try { return ccDef && ccRows.length ? ccCompute(ccDef, ccRows, '') : null; } catch (e) { return null; } })();
    const ev     = (() => { try { return (reviewForensicEvents() || [])[0] || null; } catch (e) { return null; } })();
    const sopEv  = (() => { try { return (sopEvaluateAll() || [])[0] || null; } catch (e) { return null; } })();
    const graph  = (typeof GRAPHS !== 'undefined' && GRAPHS[0]) || null;
    const nums   = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    /* Parameter name -> live value. Longest match wins, so "rows" beats "r". */
    const BY_NAME = {
      run, r: run, experiment: run, w: well, well, row: well, rec: well, x: 1, y: nums, v: 1, n: 3,
      rows: ccRows, all: ccRows, list: ccRows, arr: nums, a: nums, b: nums, values: nums, data: nums,
      curve, cur: curve, pts: (ccRes && ccRes.pts) || nums.map(v => ({ y: v })),
      def: ccDef, d: ccDef, chart: ccDef, cfg: (() => { try { return ccCfg(ccDef && ccDef.id); } catch (e) { return {}; } })(),
      res: ccRes, result: ccRes, e: ev, event: ev, events: (() => { try { return reviewForensicEvents() || []; } catch (x) { return []; } })(),
      ev: sopEv, g: graph, c: graph ? { g: graph, ri: 0, run, target: '', metric: 'outcome', signal: 'stored', log: false, colourby: 'outcome', level: 'end', control: '0' } : null,
      ctx: null, s: 'text', str: 'text', text: 'text', name: (run && run.file) || 'name', title: 'title',
      label: 'label', key: (inst && inst.key) || 'key', id: (ccDef && ccDef.id) || 'heat_rate',
      tab: 'review', kind: 'review', type: 'i', mode: 'order', sev: 'review', severity: 'review',
      pos: (well && well.pos) || 0, channel: (well && well.channel) || 0, idx: 0, i: 0, index: 0,
      cols: (run && run.cols) || 12, limit: 0.5, step: 1, ri: 0, instrument: (inst && inst.key) || '',
      variant: '', target: '', sample: '', profile: (typeof SOP !== 'undefined' ? SOP : null),
      sop: (typeof SOP !== 'undefined' ? SOP : null), p: (typeof SOP !== 'undefined' ? SOP : null),
      o: {}, obj: {}, opts: {}, options: {}, filter: '', forExport: false, on: true, flag: true,
      /* typed fixtures: a name-keyed registry is only as good as its types */
      dom: document, root: document, doc: document, el: document.body,
      an: document.body, node: document.body,
      b64: 'AAECAwQ=', bytes: new Uint8Array([0, 1, 2, 3]), buf: new ArrayBuffer(8),
      entries: [], zip: { entries: [] }, m: new Map([['k', 1]]), map: new Map([['k', 1]]),
      set: new Set(['k']), t: Date.now(), time: Date.now(), date: Date.now(),
      f: (x => x), fn: (x => x), cb: (x => x), push: (() => {}), note: (() => {}), task: null,
      fallback: null, html: '<b>x</b>', groups: [[1, 2, 3], [2, 3, 4]], counts: [1, 2, 3],
      win: 5, min: 1, slices: 4, expo: [1, 1, 1], bad: [0, 1, 0], source: 'probe',
      j: { schema: 'qpcr-instrument-history/1', rows: [] }, force: false
    };
    /* Mutable singletons are handed out as DEEP COPIES. Passing the live SOP into 587 probes
       is how a probe ends up attaching SOP to itself and every later probe dies in
       JSON.stringify with "Maximum call stack size exceeded" — a harness artefact that reads
       exactly like a code defect. */
    ['profile', 'sop', 'p'].forEach(k => { if (BY_NAME[k] && typeof structuredClone === 'function') { try { BY_NAME[k] = structuredClone(BY_NAME[k]); } catch (e) {} } });
    const NAMES = Object.keys(BY_NAME).sort((a, b) => b.length - a.length);

    /* Per-function overrides. A name-keyed registry cannot be right on its own: "cols" is a
       column-definition array in table() and a plate width in posToWell(); "t" is a
       timestamp in sopFmtTime() and a time SERIES in ccThin(). Whenever a probe throws a
       type error, the answer is one line here, not a "needs realistic fixtures" verdict. */
    const cols2 = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    const rows2 = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
    const series = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const OVERRIDE = {
      analysisResults: () => [document.createElement('obj'), 12],
      appTaskWrap: () => [['a'], () => {}],
      assignRoles: () => [(typeof RUNS !== 'undefined' ? RUNS.slice(0, 1) : [])],
      ccC: () => [[1, 2, 3, 2, 1], BY_NAME.cfg],
      ccP: () => [[1, 2, 1], [10, 10, 10], BY_NAME.cfg],
      ccU: () => [[1, 2, 1], [10, 10, 10], BY_NAME.cfg],
      ccPhase: () => [[1, 2, 3, 4, 5], 3],
      ccDynamic: () => [run, [], new Map()],
      ccThin: () => [series, series, 4],
      ccPeakRates: () => [series, series, 3, 0.1],
      ccTransitions: () => [series, series, [[0, 1]], 0.5],
      ccValue: () => [ccDef, ccRows[0] || {}, ''],
      ce: () => ['div'],
      dosStamp: () => [new Date()],
      downloadCanvas: () => [document.createElement('canvas'), 'probe.png'],
      drawAmplificationCurves: () => [document.createElement('canvas'), rows2, 'stored', false, {}],
      drawLeveyJennings: () => [document.createElement('canvas'), { points: [], mean: 0, sd: 1 }],
      edsDerived: () => [run && run.eds ? run : { eds: { exp: {}, plate: {} } }, () => {}],
      edsEvents: () => [run && run.eds ? run : { eds: { analysis: {} }, wells: [] }, () => {}],
      extent: () => [series, 0.05],
      gByDate: () => [rows2, () => run],
      makeXlsx: () => [[{ name: 'S1', cols: cols2, rows: rows2 }]],
      ownQuery: () => [document.body, 'div'],
      ownQueryAll: () => [document.body, 'div'],
      qsWorkbook: () => [run && run.eds ? run : { eds: { plate: { wells: [] }, exp: {} }, wells: [] }, {}],
      reviewDisplayFindings: () => [(() => { try { return reviewEventsWithoutIntegrity() || []; } catch (e) { return []; } })()],
      setSelectItems: () => [document.createElement('select'), [{ value: '1', label: 'one' }], null],
      sopField: () => ['Label', 'run.integrity', 'text', {}, ''],
      sopSetPath: () => ['notes', 'probe'],
      sopTableEditor: () => [document.createElement('div'), rows2, cols2, 'Add', () => ({})],
      svgPlot: () => [{ title: 'probe', x: [0, 10], y: [0, 10], series: [{ type: 'line', data: series.map((v, i) => [i, v]) }] }],
      tTest: () => [series, series.map(v => v + 1), 'two'],
      table: () => [cols2, rows2, {}],
      toCSV: () => [cols2, rows2],
      westgardReview: () => [series.map(v => ({ y: v })), 0, 1],
      readStagedCore: () => [null],
      makeStoredZip: () => [[{ name: 'a.txt', data: new Uint8Array([65]) }]],
      base64ToBytes: () => ['AAECAwQ='],
      localizeDOM: () => [document.body, false],
      validateHistoryBoundary: () => [{ schema: 'qpcr-instrument-history/1', rows: [] }, 'probe']
    };

    /* Deliberate exclusions, each with a reason that belongs in the report. */
    const EXCLUDE = {
      main: 'entry point; re-runs the whole page',
      boot: 'entry point; re-runs the whole page',
      init: 'entry point; re-runs the whole page',
      setPhase: 'mutates the lifecycle phase by design',
      ccImport: 'replaces the instrument history by design',
      sopApply: 'replaces the active profile by design',
      invalidateAnalysisCaches: 'clears caches by design'
    };

    /* ---------- 3. mutation detection ---------- */
    /* Cheap, cycle-safe and independent of page code: a probe that corrupts SOP must not
       make the snapshot itself throw or recurse (sopHash -> sopCanonical -> JSON.stringify). */
    const safeJson = (v, depth) => {
      const seen = new WeakSet();
      const walk = (x, d) => {
        if (x === null || typeof x !== 'object') return typeof x === 'function' ? 'fn' : x;
        if (seen.has(x)) return '<cycle>';
        if (d > (depth || 4)) return '<deep>';
        seen.add(x);
        if (Array.isArray(x)) return x.slice(0, 50).map(y => walk(y, d + 1));
        const o = {}; for (const k of Object.keys(x).slice(0, 40)) o[k] = walk(x[k], d + 1); return o;
      };
      try { return JSON.stringify(walk(v, 0)); } catch (e) { return 'unserialisable'; }
    };
    const snapshot = () => safeJson({
      runs: (typeof RUNS !== 'undefined' ? RUNS.length : -1),
      wells: (typeof RUNS !== 'undefined' ? RUNS.reduce((n, r) => n + ((r.wells || []).length), 0) : -1),
      cq: (typeof RUNS !== 'undefined' ? RUNS.flatMap(r => (r.wells || []).slice(0, 40).map(w => w.CpRaw)) : []),
      sop: (typeof SOP !== 'undefined' ? SOP : null),
      cc: (typeof CC_STATE !== 'undefined' ? { i: CC_STATE.instrument, f: CC_STATE.filter } : ''),
      phase: (typeof APP_STATE !== 'undefined' ? APP_STATE.phase + '/' + APP_STATE.generation : ''),
      pasted: (typeof PASTED !== 'undefined' && PASTED ? (PASTED.rows || []).length : -1)
    }, 6);

    /* A probe that writes to shared state poisons every probe after it. Keep a clean copy of
       the small mutable singletons and put them back whenever one changes. RUNS is never
       restored (too large): a probe that changes RUNS taints the rest of the pass, and the
       report says so instead of silently reporting the consequences as new defects. */
    const clean = {
      sop: (typeof SOP !== 'undefined' ? structuredClone(SOP) : null),
      cc: (typeof CC_STATE !== 'undefined' ? { ...CC_STATE } : null),
      runs: (typeof RUNS !== 'undefined' ? RUNS.length : -1)
    };
    let tainted = false;
    const restore = () => {
      try {
        if (clean.sop && typeof SOP !== 'undefined') { for (const k of Object.keys(SOP)) delete SOP[k]; Object.assign(SOP, structuredClone(clean.sop)); }
        if (clean.cc && typeof CC_STATE !== 'undefined') Object.assign(CC_STATE, clean.cc, { cache: null });
      } catch (e) {}
      if (typeof RUNS !== 'undefined' && RUNS.length !== clean.runs) tainted = true;
    };

    /* ---------- 4. probe ---------- */
    const out = [];
    for (const nm of index) {
      let fn; try { fn = eval(nm); } catch (e) { out.push({ name: nm, klass: 'unreachable', detail: e.message }); continue; }
      if (typeof fn !== 'function') { out.push({ name: nm, klass: 'constant', detail: Array.isArray(fn) ? `array[${fn.length}]` : typeof fn }); continue; }
      if (EXCLUDE[nm]) { out.push({ name: nm, klass: 'excluded', detail: EXCLUDE[nm] }); continue; }

      /* parameter names from the live function, not from the source text */
      let params = [];
      try {
        const sig = Function.prototype.toString.call(fn).replace(/\/\*[\s\S]*?\*\//g, '');
        const m = sig.match(/^[^(]*\(([^)]*)\)/) || sig.match(/^\s*(?:async\s*)?([A-Za-z_$][\w$]*)\s*=>/);
        params = m ? String(m[1] || '').split(',').map(s => s.trim().split(/[=:]/)[0].trim()).filter(Boolean) : [];
      } catch (e) { params = []; }

      let args = [], unfilled = [];
      if (OVERRIDE[nm]) { try { args = OVERRIDE[nm](); } catch (e) { args = []; } }
      else for (const raw of params) {
        if (raw.startsWith('...')) break;
        const key = raw.replace(/^\{|\}$/g, '').toLowerCase();
        const hit = NAMES.find(k => k === key) || NAMES.find(k => key.startsWith(k) || key.endsWith(k));
        if (hit && BY_NAME[hit] !== null && BY_NAME[hit] !== undefined) args.push(BY_NAME[hit]);
        else { unfilled.push(raw); args.push(undefined); }
      }
      if (!OVERRIDE[nm] && unfilled.length === params.length && params.length) {
        out.push({ name: nm, klass: 'no-fixture', detail: 'no fixture for: ' + unfilled.join(', '), arity: fn.length });
        continue;
      }

      const before = snapshot();
      let klass, detail = '';
      try {
        const v = fn(...args);
        const after = snapshot();
        if (after !== before) { klass = 'mutates'; detail = 'global state changed during a read-only probe'; restore(); }
        else {
          klass = 'pass';
          detail = v === undefined ? 'undefined' : Array.isArray(v) ? `array[${v.length}]`
            : v && typeof v === 'object' ? `object{${Object.keys(v).slice(0, 4).join(',')}}`
            : typeof v === 'string' ? `string[${v.length}]` : String(v).slice(0, 40);
        }
        if (unfilled.length) detail += ` (partial: ${unfilled.join(', ')})`;
      } catch (err) {
        if (snapshot() !== before) restore();
        klass = 'threw';
        detail = String(err && err.message || err).slice(0, 120) + (unfilled.length ? ` (unfilled: ${unfilled.join(', ')})` : '');
      }
      out.push({ name: nm, klass, detail, arity: fn.length, params: params.join(',') });
    }

    if (typeof realDownload === 'function') window.download = realDownload;
    URL.createObjectURL = realCreate;
    HTMLAnchorElement.prototype.click = realClick;

    const tally = {};
    out.forEach(o => tally[o.klass] = (tally[o.klass] || 0) + 1);
    return { indexed: index.length, missingAtRuntime: missing, tally, side, tainted, rows: out };
}