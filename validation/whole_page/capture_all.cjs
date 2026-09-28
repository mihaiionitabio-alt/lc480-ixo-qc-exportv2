/* Whole-page validation capture, in three passes.
 *   A  discovery: probe everything once, find which probes change global state
 *   B  clean pass: probe everything again in a fresh page, with those names held back,
 *      so no record in the report was taken after the state had been disturbed
 *   C  isolation: probe each state-changing name in a page of its own
 * The delivered records are B + C.
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PAGE = path.resolve('prod.html');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const corpus = fs.readdirSync('corpus').sort().map(f => path.resolve('corpus', f));
const probeSrc = fs.readFileSync('probe_all.js', 'utf8');
const RDML_FIXTURE = 'example_2_tm_annotated.rdml';

async function freshPage(browser) {
  const p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  await p.goto('file://' + PAGE);
  await p.evaluate(() => document.querySelector('nav button[data-tab="load"]').click());
  await p.setInputFiles('#file', corpus);
  await p.waitForFunction(() => !document.querySelector('#read').disabled, null, { timeout: 120000 });
  await p.click('#read');
  await p.waitForFunction(() => /Read \d+ run/.test(document.querySelector('#readmsg').innerText), null, { timeout: 600000 });
  await p.evaluate(() => {
    ['load','sop','results','panel','graphs','review','export','integrity'].forEach(t => { try { showTab(t); } catch (e) {} });
    showTab('review');
    ['overview','plate','compare','statistics','controls','runs','curves','instrument']
      .forEach(t => { const b = document.querySelector(`[data-review="${t}"]`); if (b) try { b.click(); } catch (e) {} });
  });
  /* the RDML fixture is decoded by the page's own reader, so rdmlParse is probed on real bytes */
  const b64 = fs.readFileSync(path.join('rdml', RDML_FIXTURE)).toString('base64');
  await p.evaluate(async ({ b64, name }) => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const ents = await rdmlEntries(u.buffer, name);
    const xml = new TextDecoder().decode(ents.find(e => /rdml_data\.xml$/i.test(e.name)).bytes);
    globalThis.__FIXTURES = { rdmlXml: xml, rdmlName: name, rdmlBytes: u };
  }, { b64, name: RDML_FIXTURE });
  /* the EDS module's own decoded structure, produced by the page from a real container */
  const edsName = '4Plex_Multiplex_MMx_10uL.eds';
  const edsB64 = fs.readFileSync(path.join('corpus', edsName)).toString('base64');
  await p.evaluate(async ({ b64, name }) => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    globalThis.__FIXTURES.edsName = name;
    try { globalThis.__FIXTURES.edsDoc = await EDS.parseEds(name, u); }
    catch (e) { globalThis.__FIXTURES.edsDoc = null; globalThis.__FIXTURES.edsError = e.message; }
  }, { b64: edsB64, name: edsName });
  return { p, errs };
}
const run = (p, opts) => p.evaluate(({ srcText, only, skip }) => {
  globalThis.__PROBE_ONLY = only; globalThis.__PROBE_SKIP = skip;
  return new Function('return (' + srcText + ')')()();
}, { srcText: probeSrc, only: opts.only || null, skip: opts.skip || [] });

(async () => {
  const b = await chromium.launch();
  const allErrs = [];

  /* A — discovery */
  let { p, errs } = await freshPage(b); allErrs.push(...errs);
  const A = await run(p, {});
  const mutators = A.rows.filter(r => r.klass === 'mutates').map(r => r.name);
  const state = await p.evaluate(() => ({
    runs: RUNS.length, wells: RUNS.reduce((n, r) => n + (r.wells || []).length, 0),
    files: RUNS.map(r => r.file), kinds: [...new Set(RUNS.flatMap(r => r.kinds || []))]
  }));
  await p.context().close();
  console.log('A: indexed', A.indexed, JSON.stringify(A.tally), 'mutators', mutators.length, mutators.join(','));

  /* B — clean pass */
  ({ p, errs } = await freshPage(b)); allErrs.push(...errs);
  const B = await run(p, { skip: mutators });
  await p.context().close();
  console.log('B:', JSON.stringify(B.tally), 'tainted', B.tainted);

  /* C — one page per state-changing name */
  const C = [];
  for (const nm of mutators) {
    const { p: pc, errs: ec } = await freshPage(b); allErrs.push(...ec);
    const r = await run(pc, { only: [nm] });
    await pc.context().close();
    const row = (r.rows || [])[0];
    if (row) { row.isolated = true; C.push(row); }
    console.log('C:', nm, row && row.klass);
  }

  const rows = B.rows.concat(C);
  const tally = {}; rows.forEach(r => tally[r.klass] = (tally[r.klass] || 0) + 1);
  const provTally = {}; rows.forEach(r => (r.args || []).forEach(a => provTally[a.prov] = (provTally[a.prov] || 0) + 1));
  const out = {
    build: { page: 'qpcr_qc_forensics.html', sha256: sha(PAGE), bytes: fs.statSync(PAGE).size },
    capturedAt: new Date().toISOString(),
    corpus: corpus.concat([path.resolve('rdml', RDML_FIXTURE)])
      .map(f => ({ file: path.basename(f), bytes: fs.statSync(f).size, sha256: sha(f) })),
    state, pageErrors: allErrs, passes: { A: A.tally, B: B.tally, isolated: C.length },
    indexed: A.indexed, missingAtRuntime: A.missingAtRuntime, tally, provTally, rows
  };
  fs.writeFileSync('validation_full.json', JSON.stringify(out, null, 1));
  console.log('final', JSON.stringify(tally), 'prov', JSON.stringify(provTally), 'pageErrors', allErrs.length);
  await b.close();
})();
