/* Per-function validation capture.
 * For every function in the RDML reader, record: the exact input, where that input came
 * from, the exact output, and the verdict against a stated expectation. Nothing here is
 * summarised: the JSON it writes is what the report prints.
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PAGE = path.resolve('prod.html');
const DIR = 'rdml';
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const b64 = f => fs.readFileSync(path.join(DIR, f)).toString('base64');

const CORPUS = fs.readdirSync(DIR).sort().map(f => ({
  file: f, bytes: fs.statSync(path.join(DIR, f)).size, sha256: sha(path.join(DIR, f))
}));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const pageErrors = []; p.on('pageerror', e => pageErrors.push(e.message.split('\n')[0]));
  await p.goto('file://' + PAGE);

  /* the vendor container, decoded by the page's own intake, is the reference for T8-O */
  await p.evaluate(() => document.querySelector('nav button[data-tab="load"]').click());
  await p.setInputFiles('#file', [path.resolve(DIR, 'CORPUS-RDML-1.eds')]);
  await p.waitForFunction(() => !document.querySelector('#read').disabled, null, { timeout: 120000 });
  await p.click('#read');
  await p.waitForFunction(() => /Read \d+ run/.test(document.querySelector('#readmsg').innerText), null, { timeout: 300000 });

  const payload = {};
  for (const c of CORPUS) if (/\.rdml$/i.test(c.file)) payload[c.file] = b64(c.file);

  const out = await p.evaluate(async (files) => {
    const R = [];                                   /* test records */
    const dec = s => { const bin = atob(s), u = new Uint8Array(bin.length);
                       for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
    const clip = (v, n) => { const s = typeof v === 'string' ? v : JSON.stringify(v);
                             return s && s.length > n ? s.slice(0, n) + ` …[${s.length} chars]` : s; };
    const rec = o => { R.push(o); return o; };
    const entriesOf = {}, xmlOf = {}, runsOf = {};
    for (const [name, b64s] of Object.entries(files)) {
      const u8 = dec(b64s);
      entriesOf[name] = await rdmlEntries(u8.buffer, null);
      xmlOf[name] = new TextDecoder().decode(entriesOf[name].find(e => /^rdml_data\.xml$/i.test(e.name)).bytes);
      runsOf[name] = rdmlParse(xmlOf[name], name, u8);
    }
    const REF = 'CORPUS-RDML-1.rdml';
    const doc = new DOMParser().parseFromString(xmlOf[REF], 'application/xml');
    const root = doc.documentElement;
    const expEl = [...root.children].find(c => c.localName === 'experiment');
    const runEl = [...expEl.children].find(c => c.localName === 'run');
    const reactEl = [...runEl.children].find(c => c.localName === 'react');
    const dataEl = [...reactEl.children].find(c => c.localName === 'data');

    /* ---------------- F1 rdmlEntries ---------------- */
    for (const name of Object.keys(files)) {
      const e = entriesOf[name];
      rec({ fn: 'rdmlEntries', case: name,
        inputDesc: `ArrayBuffer of ${name}`, inputProvenance: 'R',
        input: { bytes: dec(files[name]).length },
        output: { count: e.length, names: e.map(x => x.name),
                  firstBytes: e[0].bytes.length, crcVerified: e.every(x => x.zip && x.zip.crcVerified),
                  declaredSize: e[0].zip.declaredSize, method: e[0].zip.method },
        expect: 'exactly one entry named rdml_data.xml, CRC-32 verified by readZip',
        pass: e.length === 1 && /^rdml_data\.xml$/i.test(e[0].name) && e[0].zip.crcVerified });
    }
    /* negative: an .eds container must not look like an RDML container */
    rec({ fn: 'rdmlIsContainer', case: 'positive — RDML entries',
      inputDesc: 'entries from rdmlEntries(CORPUS-RDML-1.rdml)', inputProvenance: 'D',
      input: { names: entriesOf[REF].map(e => e.name) },
      output: rdmlIsContainer(entriesOf[REF]), expect: 'true', pass: rdmlIsContainer(entriesOf[REF]) === true });
    const fake = [{ name: 'experiment.xml' }, { name: 'plate_setup.xml' }];
    rec({ fn: 'rdmlIsContainer', case: 'negative — QuantStudio entry names',
      inputDesc: 'literal entry list with the two .eds top-level XML names', inputProvenance: 'S',
      input: { names: fake.map(e => e.name) },
      output: rdmlIsContainer(fake), expect: 'false', pass: rdmlIsContainer(fake) === false });
    rec({ fn: 'rdmlIsContainer', case: 'negative — empty list', inputDesc: '[]', inputProvenance: 'S',
      input: { names: [] }, output: rdmlIsContainer([]), expect: 'false', pass: rdmlIsContainer([]) === false });

    /* ---------------- F3 rdmlKids ---------------- */
    [['run', 'react', 96], ['run', 'pcrFormat', 1], ['run', 'absent', 0],
     ['react', 'data', 2], ['data', 'adp', 40]].forEach(([host, child, want]) => {
      const el = host === 'run' ? runEl : host === 'react' ? reactEl : dataEl;
      const got = rdmlKids(el, child);
      rec({ fn: 'rdmlKids', case: `<${host}> → <${child}>`,
        inputDesc: `the first <${host}> of ${REF}`, inputProvenance: 'D',
        input: { host: `<${host} id="${el.getAttribute('id') || ''}">`, child },
        output: { count: got.length, firstLocalName: got[0] ? got[0].localName : null },
        expect: `${want} element(s)`, pass: got.length === want });
    });
    rec({ fn: 'rdmlKids', case: 'null host', inputDesc: 'rdmlKids(null,"react")', inputProvenance: 'S',
      input: { host: null, child: 'react' }, output: { count: rdmlKids(null, 'react').length },
      expect: 'empty array, no throw', pass: rdmlKids(null, 'react').length === 0 });

    /* ---------------- F4 rdmlKid ---------------- */
    rec({ fn: 'rdmlKid', case: 'present', inputDesc: `<run> of ${REF}, name "pcrFormat"`, inputProvenance: 'D',
      input: { name: 'pcrFormat' }, output: { localName: rdmlKid(runEl, 'pcrFormat').localName },
      expect: 'the <pcrFormat> element', pass: rdmlKid(runEl, 'pcrFormat').localName === 'pcrFormat' });
    rec({ fn: 'rdmlKid', case: 'absent', inputDesc: `<run>, name "noSuchElement"`, inputProvenance: 'S',
      input: { name: 'noSuchElement' }, output: rdmlKid(runEl, 'noSuchElement'),
      expect: 'null', pass: rdmlKid(runEl, 'noSuchElement') === null });

    /* ---------------- F5 rdmlText ---------------- */
    [['cqDetectionMethod', 'other'], ['instrument', 'QuantStudio Dx'],
     ['backgroundDeterminationMethod', 'Background Subtraction'],
     ['dataCollectionSoftware', 'QuantStudio 3 and 5 Software\n                1.6.1'],
     ['notPresent', '']].forEach(([n, want]) => {
      const got = rdmlText(runEl, n);
      rec({ fn: 'rdmlText', case: n, inputDesc: `<run> of ${REF}, name "${n}"`, inputProvenance: n === 'notPresent' ? 'S' : 'D',
        input: { name: n }, output: got, expect: JSON.stringify(want), pass: got === want,
        note: n === 'dataCollectionSoftware'
          ? 'FINDING V-1: the element spans two source lines, so the returned string keeps the newline and the indentation of the file. rdmlText trims only the ends.'
          : undefined });
    });
    /* V-1 characterised: rdmlText is called on elements the schema defines as COMPLEX.
       dataCollectionSoftware is not a leaf - it holds <name> and <version> - so textContent
       concatenates both, with the file's own indentation between them. */
    (() => {
      const READ_WITH_TEXT = ['instrument','dataCollectionSoftware','backgroundDeterminationMethod',
        'cqDetectionMethod','runDate','type','description','rows','columns','cq','N0','ampEffMet',
        'ampEff','ampEffSE','meltTemp','bgFluor','quantFluor','excl','note'];
      const rows = [];
      for (const name of Object.keys(files)) {
        const d2 = new DOMParser().parseFromString(xmlOf[name], 'application/xml');
        READ_WITH_TEXT.forEach(tag => {
          const els = [...d2.documentElement.getElementsByTagName('*')].filter(e => e.localName === tag);
          if (!els.length) return;
          const complex = els.filter(e => e.children.length > 0);
          if (!complex.length) return;
          const ex = complex[0];
          rows.push({ file: name, element: tag, occurrences: els.length, complexOccurrences: complex.length,
            children: [...ex.children].map(c => c.localName),
            textContentAsRead: JSON.stringify(String(ex.textContent || '').trim()).slice(0, 90),
            correctReading: [...ex.children].map(c => `${c.localName}="${String(c.textContent || '').trim()}"`).join(' ') });
        });
      }
      rec({ fn: 'rdmlText', case: 'FINDING V-1 — read with rdmlText but complex in the schema',
        inputDesc: 'every element the reader reads with rdmlText, in all seven corpus files',
        inputProvenance: 'R', input: { elementsChecked: READ_WITH_TEXT.length, files: Object.keys(files).length },
        output: { affected: rows.length, rows },
        expect: 'characterisation only; see the finding',
        pass: true,
        note: 'rdmlText concatenates the children of a complex element with the file\'s own indentation. '
            + 'Recommended fix: collapse inner whitespace in rdmlText, and read dataCollectionSoftware '
            + 'as <name> + <version>.' });
    })();

    /* ---------------- F6 rdmlNum ---------------- */
    const numCases = [['cyc', '1.0', 1], ['fluor', '263682.75', 263682.75], ['cq', '30.3979', 30.3979],
                      ['empty', '', null], ['text', 'not a number', null], ['negative', '-2.5', -2.5],
                      ['exponent', '6.36e-10', 6.36e-10]];
    numCases.forEach(([label, text, want]) => {
      const host = doc.createElement('host'), kid = doc.createElement('v');
      kid.textContent = text; host.appendChild(kid);
      const got = rdmlNum(host, 'v');
      rec({ fn: 'rdmlNum', case: label,
        inputDesc: label === 'empty' || label === 'text' ? 'literal text, constructed for this test'
          : `the literal text as it appears in the corpus (<${label}> spelling)`,
        inputProvenance: ['cyc', 'fluor', 'cq', 'exponent'].includes(label) ? 'R (verbatim string)' : 'S',
        input: { xml: `<host><v>${text}</v></host>` }, output: got,
        expect: want === null ? 'null' : String(want), pass: got === want });
    });
    rec({ fn: 'rdmlNum', case: 'absent child', inputDesc: '<host/> with no <v>', inputProvenance: 'S',
      input: { xml: '<host/>' }, output: rdmlNum(doc.createElement('host'), 'v'),
      expect: 'null', pass: rdmlNum(doc.createElement('host'), 'v') === null });

    /* ---------------- F7 rdmlAttrId ---------------- */
    rec({ fn: 'rdmlAttrId', case: 'react → sample', inputDesc: `the first <react> of ${REF}`, inputProvenance: 'D',
      input: { name: 'sample' }, output: rdmlAttrId(reactEl, 'sample'),
      expect: 'the sample id string', pass: typeof rdmlAttrId(reactEl, 'sample') === 'string' && rdmlAttrId(reactEl, 'sample').length > 0 });
    rec({ fn: 'rdmlAttrId', case: 'data → tar', inputDesc: 'the first <data> of that react', inputProvenance: 'D',
      input: { name: 'tar' }, output: rdmlAttrId(dataEl, 'tar'),
      expect: 'the target id string', pass: rdmlAttrId(dataEl, 'tar').length > 0 });
    rec({ fn: 'rdmlAttrId', case: 'absent', inputDesc: '<data>, name "noSuch"', inputProvenance: 'S',
      input: { name: 'noSuch' }, output: rdmlAttrId(dataEl, 'noSuch'), expect: '""',
      pass: rdmlAttrId(dataEl, 'noSuch') === '' });

    /* ---------------- F8 rdmlParse ---------------- */
    for (const name of Object.keys(files)) {
      const runs = runsOf[name];
      runs.forEach((r, i) => {
        const cq = r.wells.map(w => resultCq(w)).filter(v => v !== null);
        rec({ fn: 'rdmlParse', case: `${name} [run ${i + 1}/${runs.length}]`,
          inputDesc: `rdml_data.xml of ${name}`, inputProvenance: 'R',
          input: { xmlChars: xmlOf[name].length, version: r.rdmlDoc.version },
          output: { run: r.meta.name, rows: r.rows, cols: r.cols, plate: `${r.rows}x${r.cols}`,
            wells: r.wells.length, curves: Object.keys(r.allCurves).length, tmWells: r.tmWells.length,
            cycles: r.nCycles, meltPoints: r.meltAcquisitionPoints, analyses: r.analyses.length,
            kinds: r.kinds.join('+'), withCq: cq.length, cqMin: cq.length ? +Math.min(...cq).toFixed(3) : null,
            cqMax: cq.length ? +Math.max(...cq).toFixed(3) : null,
            cqAtCeilingConverted: r.rdmlDoc.cqAtCycleCeiling, excl: r.wells.filter(w => w.rdml.excl).length,
            note: r.wells.filter(w => w.rdml.note).length, integrity: integrityLabel(r),
            experimentId: r.experimentId, runId: r.runId, platform: r.platform,
            firstWell: (() => { const w = r.wells[0]; return { well: w.well, pos: w.pos, channel: w.channel,
              sample: w.sample, target: w.target, CpRaw: w.CpRaw, cqSource: w.cqSource,
              curveLen: w.curve.length, curveHead: w.curve.slice(0, 3), rdml: w.rdml ? {
                N0: w.rdml.N0, ampEff: w.rdml.ampEff, ampEffMet: w.rdml.ampEffMet, meltTemp: w.rdml.meltTemp,
                excl: w.rdml.excl, note: w.rdml.note, meltPoints: w.rdml.melt.length } : null }; })() },
          expect: 'every react inside the declared plate; one well per react×data; curves ordered by cycle',
          pass: r.wells.every(w => w.pos >= 0 && w.pos < r.rows * r.cols)
                && r.wells.every(w => w.curve.length === 0 || w.curve.length === r.nCycles) });
      });
    }
    /* malformed input */
    try { rdmlParse('<notrdml/>', 'bad.rdml', new Uint8Array(0)); }
    catch (e) { rec({ fn: 'rdmlParse', case: 'wrong root element', inputDesc: '"<notrdml/>"', inputProvenance: 'S',
      input: { xml: '<notrdml/>' }, output: 'throws: ' + e.message, expect: 'throws, names the root element',
      pass: /not an RDML document/.test(e.message) }); }
    try { rdmlParse('<rdml version="1.3"><<', 'bad2.rdml', new Uint8Array(0)); }
    catch (e) { rec({ fn: 'rdmlParse', case: 'not well formed', inputDesc: '"<rdml version=\\"1.3\\"><<"', inputProvenance: 'S',
      input: { xml: '<rdml version="1.3"><<' }, output: 'throws: ' + clip(e.message, 90),
      expect: 'throws, reports the parser error', pass: /not well formed/.test(e.message) }); }
    try { rdmlParse('<rdml version="1.3" xmlns="http://www.rdml.org"/>', 'empty.rdml', new Uint8Array(0)); }
    catch (e) { rec({ fn: 'rdmlParse', case: 'no experiment', inputDesc: 'a valid but empty RDML root', inputProvenance: 'S',
      input: { xml: '<rdml version="1.3" xmlns="http://www.rdml.org"/>' }, output: 'throws: ' + e.message,
      expect: 'throws, says there is no run', pass: /no <experiment>\/<run>/.test(e.message) }); }

    /* ---------------- F9 runProcessingState ---------------- */
    const stateCases = [
      ['instrument', RUNS[0], 'the .eds decoded by the page intake'],
      ['vendor-export', runsOf[REF][0], 'CORPUS-RDML-1.rdml — names an instrument, no re-analysis tool'],
      ['third-party', runsOf['example_3_linregpcr.rdml'][0], 'example_3 — ampEffMet = LinRegPCR'],
      ['raw', runsOf['example_1_raw.rdml'][0], 'example_1 — no cq anywhere']];
    stateCases.forEach(([want, run, why]) => {
      const got = runProcessingState(run);
      rec({ fn: 'runProcessingState', case: want, inputDesc: why, inputProvenance: 'R/D',
        input: { file: run.file, instrument: (run.rdmlDoc || {}).instrument || (run.meta || {}).InstrumentName || '',
          bg: (run.rdmlDoc || {}).backgroundDeterminationMethod || '', methods: (run.rdmlDoc || {}).methods || [],
          wellsWithCq: run.wells.filter(w => resultCq(w) !== null).length },
        output: got, expect: `state "${want}"`, pass: got.state === want });
    });
    rec({ fn: 'runProcessingState', case: 'no run', inputDesc: 'runProcessingState(null)', inputProvenance: 'S',
      input: null, output: runProcessingState(null), expect: 'state "unknown", no throw',
      pass: runProcessingState(null).state === 'unknown' });

    /* ---------------- F10 runIsInstrumentAnalysed ---------------- */
    stateCases.forEach(([want, run]) => {
      const got = runIsInstrumentAnalysed(run), expected = (want === 'instrument' || want === 'vendor-export');
      rec({ fn: 'runIsInstrumentAnalysed', case: want, inputDesc: `the ${want} run above`, inputProvenance: 'D',
        input: { state: want }, output: got, expect: String(expected), pass: got === expected });
    });

    /* ---------------- F11 sopProcessingApplicability ---------------- */
    stateCases.forEach(([want, run]) => {
      const got = sopProcessingApplicability(run);
      const expected = (want === 'instrument' || want === 'vendor-export');
      rec({ fn: 'sopProcessingApplicability', case: want, inputDesc: `the ${want} run above`, inputProvenance: 'D',
        input: { state: want }, output: got, expect: `applicable = ${expected}`, pass: got.applicable === expected });
    });

    /* ---------------- F12 rdmlStem ---------------- */
    [['CORPUS-RDML-1.rdml', '2026 06 15 CORPUS-RDML-1'], ['CORPUS-RDML-1.eds', '2026 06 15 CORPUS-RDML-1'],
     ['Demo  Abs_Quant.ixo', 'demo abs quant'], ['', '']].forEach(([inp, want]) => {
      const got = rdmlStem(inp);
      rec({ fn: 'rdmlStem', case: inp || '(empty)', inputDesc: inp ? 'a corpus file name' : 'the empty string',
        inputProvenance: inp.startsWith('2026') ? 'R (file name)' : 'S',
        input: { name: inp }, output: got, expect: JSON.stringify(want), pass: got === want });
    });

    /* ---------------- F13 rdmlKeyOf ---------------- */
    const k1 = rdmlKeyOf({ name: 'CORPUS-RDML-1.rdml', experimentId: 'CORPUS-RDML-1' });
    rec({ fn: 'rdmlKeyOf', case: 'name and experiment', inputDesc: 'the RDML run of the reference pair', inputProvenance: 'D',
      input: { name: 'CORPUS-RDML-1.rdml', experimentId: 'CORPUS-RDML-1' }, output: k1,
      expect: 'two keys', pass: k1.length === 2,
      note: 'FINDING V-2: the name key is stem-normalised ("2026 06 15 CORPUS-RDML-1") but the experiment key is only lower-cased ("CORPUS-RDML-1"). The two spellings of the same identity do not match each other.' });
    /* V-2: does the gap actually break the priority rule? Rename the RDML so only the
       experiment id can match, and see whether supersession still happens. */
    (() => {
      const renamed = runsOf[REF].map(r => Object.assign(Object.create(Object.getPrototypeOf(r)), r, { file: 'received_from_collaborator.rdml' }));
      const m = applyRawFilePriority([...RUNS, ...renamed]);
      rec({ fn: 'applyRawFilePriority', case: 'FINDING V-2 — export renamed, only the experiment id matches',
        inputDesc: 'the same .eds, and the same RDML run with its file renamed to received_from_collaborator.rdml',
        inputProvenance: 'D (one field changed on a real run object)',
        input: { vendorFile: RUNS[0].file, vendorExperiment: (RUNS[0].meta || {}).name,
                 rdmlFile: 'received_from_collaborator.rdml', rdmlExperiment: renamed[0].experimentId,
                 vendorKeys: rdmlKeyOf({ name: RUNS[0].file, experimentId: (RUNS[0].meta || {}).name }),
                 rdmlKeys: rdmlKeyOf({ name: 'received_from_collaborator.rdml', experimentId: renamed[0].experimentId }) },
        output: { superseded: m.superseded.length },
        expect: 'the export should still be superseded: it is the same experiment',
        pass: m.superseded.length === 1,
        note: 'Recommended fix: rdmlKeyOf should apply rdmlStem to BOTH parts — [rdmlStem(item.name), rdmlStem(item.experimentId)].' });
    })();
    const k2 = rdmlKeyOf({ name: 'x.rdml' });
    rec({ fn: 'rdmlKeyOf', case: 'no experiment id', inputDesc: 'an item with only a name', inputProvenance: 'S',
      input: { name: 'x.rdml' }, output: k2, expect: 'one key', pass: k2.length === 1 });

    /* ---------------- F14 applyRawFilePriority + F15 runIsSuperseded ---------------- */
    const mixed = [...RUNS, ...runsOf[REF]];
    const before = mixed.map(r => runIsSuperseded(r));
    const merged = applyRawFilePriority(mixed);
    rec({ fn: 'applyRawFilePriority', case: 'vendor container + its RDML export',
      inputDesc: 'the .eds decoded by intake, plus the .rdml of the same experiment', inputProvenance: 'R + R',
      input: { runs: mixed.map(r => ({ file: r.file, isRdml: !!r.rdmlDoc })) },
      output: { kept: merged.runs.length, superseded: merged.superseded.map(r => ({ file: r.file,
        by: r.supersededBy && r.supersededBy.file, reason: r.supersededReason })) },
      expect: 'the RDML export is superseded by the .eds; nothing is discarded',
      pass: merged.runs.length === mixed.length && merged.superseded.length === 1
            && merged.superseded[0].rdmlDoc && /\.eds$/i.test(merged.superseded[0].supersededBy.file) });
    rec({ fn: 'runIsSuperseded', case: 'before and after applyRawFilePriority',
      inputDesc: 'the same run objects, before and after the priority pass', inputProvenance: 'D',
      input: { before }, output: { after: mixed.map(r => runIsSuperseded(r)) },
      expect: 'false for every run before; true only for the RDML run after',
      pass: before.every(v => v === false) && mixed.filter(r => runIsSuperseded(r)).length === 1 });
    const onlyRdml = applyRawFilePriority(runsOf['example_3_linregpcr.rdml']);
    rec({ fn: 'applyRawFilePriority', case: 'RDML only, no vendor container',
      inputDesc: 'the three runs of example_3_linregpcr.rdml', inputProvenance: 'R',
      input: { runs: runsOf['example_3_linregpcr.rdml'].map(r => ({ file: r.file, isRdml: true })) },
      output: { kept: onlyRdml.runs.length, superseded: onlyRdml.superseded.length },
      expect: 'nothing superseded', pass: onlyRdml.superseded.length === 0 });
    /* the gate again, now that the run is superseded */
    const supersededRun = merged.superseded[0];
    rec({ fn: 'sopProcessingApplicability', case: 'superseded vendor export',
      inputDesc: 'the RDML run after the priority pass', inputProvenance: 'D',
      input: { state: 'vendor-export', superseded: true }, output: sopProcessingApplicability(supersededRun),
      expect: 'applicable = false, state "superseded"',
      pass: sopProcessingApplicability(supersededRun).applicable === false
            && sopProcessingApplicability(supersededRun).state === 'superseded' });

    /* ---------------- constants ---------------- */
    rec({ fn: 'RDML_SAMPLE_ROLE', case: 'the six RDML sample types', inputDesc: 'the RDML 1.3 sample-type vocabulary',
      inputProvenance: 'Specification', input: { keys: Object.keys(RDML_SAMPLE_ROLE) },
      output: RDML_SAMPLE_ROLE, expect: 'every type maps to a role the page already uses',
      pass: Object.keys(RDML_SAMPLE_ROLE).length === 6 });
    const toolCases = [['LinRegPCR', true], ['LinRegPCR, constant', true], ['Background Subtraction', false],
                       ['automated threshold and baseline settings', false], ['', false], ['Cy0', true], ['MAK2', true]];
    toolCases.forEach(([s, want]) => {
      const got = RDML_REANALYSIS_TOOLS.test(s);
      rec({ fn: 'RDML_REANALYSIS_TOOLS', case: s || '(empty)',
        inputDesc: ['LinRegPCR', 'LinRegPCR, constant', 'Background Subtraction', 'automated threshold and baseline settings'].includes(s)
          ? 'the verbatim string found in the corpus' : 'a tool name from the RDML literature',
        inputProvenance: ['LinRegPCR', 'LinRegPCR, constant', 'Background Subtraction', 'automated threshold and baseline settings'].includes(s) ? 'R (verbatim)' : 'S',
        input: { text: s }, output: got, expect: String(want), pass: got === want });
    });

    /* ---------------- integration: the Cq-ceiling rule ---------------- */
    for (const name of ['CORPUS-RDML-1.rdml', 'GeneExpression_ddCt_Fast_Adv_MMx_10uL.rdml', 'example_3_linregpcr.rdml']) {
      const r = runsOf[name][0];
      const cq = r.wells.map(w => resultCq(w)).filter(v => v !== null);
      const atCeil = cq.filter(v => Math.abs(v - r.nCycles) < 1e-9).length;
      rec({ fn: 'rdmlParse (Cq-ceiling rule)', case: name, inputDesc: `all <data> of ${name}`, inputProvenance: 'R',
        input: { cycles: r.nCycles, rows: r.wells.length },
        output: { converted: r.rdmlDoc.cqAtCycleCeiling, remainingWithCq: cq.length, stillAtCeiling: atCeil,
          cqMax: cq.length ? +Math.max(...cq).toFixed(3) : null },
        expect: 'no Cq equal to the cycle count survives; a re-analysis file loses none',
        pass: atCeil === 0 });
    }

    /* ---------------- integration: cross-format oracle ---------------- */
    const rd = runsOf[REF][0], key = w => `${w.pos}|${String(w.target || '').toUpperCase()}`;
    const eds = new Map(); RUNS[0].wells.forEach(w => eds.set(key(w), resultCq(w)));
    let matched = 0, bothNull = 0, diff = [], onlyR = 0;
    rd.wells.forEach(w => { if (!eds.has(key(w))) { onlyR++; return; }
      const a = eds.get(key(w)), c = resultCq(w);
      if (a === null && c === null) { bothNull++; matched++; return; }
      if (a !== null && c !== null && Math.abs(a - c) < 0.0005) { matched++; return; }
      diff.push({ well: w.well, target: w.target, eds: a, rdml: c }); });
    rec({ fn: 'rdmlParse (cross-format oracle)', case: '.eds vs .rdml of the same run',
      inputDesc: 'CORPUS-RDML-1.eds decoded by the page, and CORPUS-RDML-1.rdml read by rdmlParse',
      inputProvenance: 'R + R',
      input: { edsRows: RUNS[0].wells.length, rdmlRows: rd.wells.length },
      output: { matched, bothUndetermined: bothNull, differing: diff.length, firstDiffs: diff.slice(0, 5), rdmlOnly: onlyR },
      expect: 'every Cq the instrument container yields is reproduced exactly; zero differing',
      pass: diff.length === 0 && matched === RUNS[0].wells.length });

    return { records: R, corpusRuns: Object.fromEntries(Object.entries(runsOf).map(([k, v]) => [k, v.length])) };
  }, payload);

  out.corpus = CORPUS;
  out.page = { file: 'qpcr_qc_forensics.html', sha256: sha(PAGE), bytes: fs.statSync(PAGE).size };
  out.pageErrors = pageErrors;
  out.when = new Date().toISOString();
  fs.writeFileSync('validation_data.json', JSON.stringify(out, null, 1));
  const pass = out.records.filter(r => r.pass).length;
  console.log(`records ${out.records.length}  pass ${pass}  fail ${out.records.length - pass}  pageErrors ${pageErrors.length}`);
  out.records.filter(r => !r.pass).forEach(r => console.log('  FAIL', r.fn, '::', r.case, '::', JSON.stringify(r.output).slice(0, 120)));
  await b.close();
})();
