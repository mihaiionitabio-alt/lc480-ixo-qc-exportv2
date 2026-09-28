/* Does a synthetic fixture close the "needs fixtures" gap, and does the page produce the
 * known answers from it? Three passes over the same page, no laboratory file anywhere:
 *
 *   A  empty page            - reproduces the "requires realistic fixtures" verdict
 *   B  synthetic fixture     - the invented run injected into the model
 *   C  (optional) real files - only to show A/B/C side by side
 *
 *   node synthetic_probe.cjs <page.html> [folder-of-real-files]
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const PAGE = path.resolve(process.argv[2]);
const REAL = process.argv[3];
const FIXTURE = fs.readFileSync(path.join(__dirname, 'synthetic_fixture.js'), 'utf8');
const PROBE = fs.readFileSync(path.join(__dirname, 'probe_core.js'), 'utf8');

async function pass(browser, label, prepare) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  await p.goto('file://' + PAGE);
  if (prepare) await prepare(p);
  const r = await p.evaluate(`(${PROBE})()`);
  await ctx.close();
  return { label, tally: r.tally, indexed: r.indexed, pageErrors: errs.length, rows: r.rows };
}

(async () => {
  const b = await chromium.launch();

  const A = await pass(b, 'A · empty page (no fixture)', null);

  const B = await pass(b, 'B · synthetic fixture', async p => {
    await p.addScriptTag({ content: FIXTURE });
    await p.evaluate(() => {
      RUNS = [window.SYNTH.run];
      SOP = window.SYNTH.profile();
      if (typeof assignRoles === 'function') assignRoles(RUNS);
      if (typeof invalidateAnalysisCaches === 'function') invalidateAnalysisCaches();
      SOP_CACHE = null;
      if (typeof CC_STATE !== 'undefined') { CC_STATE.cache = null; CC_STATE.instrument = ''; }
      if (typeof refreshAll === 'function') refreshAll();
      ['load','sop','results','panel','graphs','review','export','integrity'].forEach(t => { try { showTab(t); } catch (e) {} });
      showTab('review');
      ['overview','plate','compare','statistics','controls','runs','curves','instrument']
        .forEach(t => { const x = document.querySelector(`[data-review="${t}"]`); if (x) try { x.click(); } catch (e) {} });
    });
  });

  /* ---- the oracle: does the page give the known answers? ---- */
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const oerr = []; p.on('pageerror', e => oerr.push(e.message.split('\n')[0]));
  await p.goto('file://' + PAGE);
  await p.addScriptTag({ content: FIXTURE });
  const oracle = await p.evaluate(() => {
    const E = window.SYNTH.expect, out = [];
    const t = (name, got, want) => out.push({ name, got, want, ok: JSON.stringify(got) === JSON.stringify(want) });
    const load = which => {
      RUNS = [window.SYNTH.variant(which)]; SOP = window.SYNTH.profile();
      if (typeof assignRoles === 'function') assignRoles(RUNS);
      if (typeof invalidateAnalysisCaches === 'function') invalidateAnalysisCaches();
      SOP_CACHE = null; if (typeof CC_STATE !== 'undefined') { CC_STATE.cache = null; CC_STATE.instrument = ''; }
    };

    /* ---------- variant "clean": one anomaly class at a time ---------- */
    load('clean');
    t('runs decoded', RUNS.length, E.runs);
    t('result rows', RUNS[0].wells.length, E.wells);
    t('curve entries', Object.keys(RUNS[0].allCurves).length, E.curves);
    t('integrity mismatches (clean)', integrityMismatches().length, E.integrityMismatches.clean);

    const rising = (typeof risingCurveRows === 'function' ? risingCurveRows() : reviewOrphanWells());
    t('rising-curve findings', rising.length, E.risingCurveFindings);
    t('of which error level', rising.filter(r => (r.level || r.severity) === 'error').length, E.risingCurveErrors);
    t('flagged positions', rising.map(r => r.well).sort(), E.flaggedWells.slice().sort());
    t('empty noise wells flagged', rising.filter(r => !r.sample).length, E.emptyWellsFlagged);

    const undet = RUNS[0].wells.filter(w => w.CpRaw === null);
    t('undetermined rows', undet.length, E.undeterminedRows);
    t('undetermined read as Cq 0', undet.filter(w => (typeof resultCq === 'function' ? resultCq(w) : null) === 0).length, E.cqZeroRows);
    t('undetermined counts as answered',
      undet.every(w => (typeof resultAnswers === 'function' ? resultAnswers(w) : 'undetermined') === 'undetermined'), true);

    const ev = sopEvaluateAll()[0], rows = ev.rows || [];
    const t1 = rows.filter(r => r.target === 'SYN-T1' && !r.ctrl);
    t('run accepted (clean)', /Invalid run/.test(String(ev.status)) === false, true);
    t('sample groups of the target', t1.length, E.sampleGroupsOfTarget);
    t('positive samples', t1.filter(r => r.outcome === 'Positive').length, E.positiveSamples);
    t('negative samples', t1.filter(r => r.outcome === 'Negative').length, E.negativeSamples);
    t('repeated samples', t1.filter(r => r.outcome === 'Repeat').length, E.repeatSamples);
    t('mean Cq of a positive group', +((t1.find(r => r.sample === 'SYN-001') || {}).cqMean || 0).toFixed(2), E.meanCqOfPositiveTarget);
    t('reference Cq', +((rows.find(r => r.target === 'SYN-REF' && r.sample === 'SYN-001') || {}).cqMean || 0).toFixed(2), E.referenceCq);
    t('replicate spread is repeated', (t1.find(r => r.sample === 'SYN-020') || {}).outcome, 'Repeat');
    t('late signal is repeated', (t1.find(r => r.sample === 'SYN-019') || {}).outcome, 'Repeat');

    const raw = reviewEventsWithoutIntegrity() || [];
    t('integrity stays out of the review list', raw.filter(e => /integrity/i.test(String(e.area || ''))).length, 0);
    t('distinct never exceeds raw', reviewDisplayFindings(raw).length <= raw.length, true);
    t('exports build from the fixture',
      [sopSampleRows('', true).length > 0, sopInterpretationRows('', true).length > 0,
       sopCriteriaRows().length > 0, sopRunRows().length === 1, metaRows().length === 1].every(Boolean), true);
    const outcomes = {}; ['Positive','Negative','Repeat','Inconclusive','Invalid run','Control pass','Control fail']
      .forEach(o => outcomes[o] = rows.filter(r => r.outcome === o).length);
    const groupNames = t1.map(r => r.sample);

    /* ---------- variant "integrity": the one thing that differs ---------- */
    load('integrity');
    const ev2 = sopEvaluateAll()[0];
    t('integrity mismatches (mismatch variant)', integrityMismatches().length, E.integrityMismatches.integrity);
    t('the run is rejected', String(ev2.status), 'Rejected');
    t('every sample becomes invalid',
      (ev2.rows || []).filter(r => !r.ctrl && r.target === 'SYN-T1').every(r => r.outcome === E.runStatusWithBadIntegrity), true);
    t('stored Cq is unchanged by rejection',
      RUNS[0].wells.filter(w => w.sample === 'SYN-001' && w.target === 'SYN-T1').map(w => w.CpRaw), [30, 30]);

    return { checks: out, outcomes, groupNames };
  });
  await ctx.close();

  let C = null;
  if (REAL) {
    const files = fs.readdirSync(REAL).filter(f => /\.(ixo|eds)$/i.test(f)).slice(0, 4).map(f => path.join(REAL, f));
    C = await pass(b, 'C · real files', async p => {
      await p.evaluate(() => document.querySelector('nav button[data-tab="load"]').click());
      await p.setInputFiles('#file', files);
      await p.waitForFunction(() => !document.querySelector('#read').disabled, null, { timeout: 120000 });
      await p.click('#read');
      await p.waitForFunction(() => /Read \d+ run/.test(document.querySelector('#readmsg').innerText), null, { timeout: 300000 });
      await p.evaluate(() => { ['load','sop','results','panel','graphs','review','export','integrity'].forEach(t => { try { showTab(t); } catch (e) {} }); });
    });
  }

  console.log('=== probe classes, same page, three fixture states\n');
  const keys = ['pass', 'threw', 'no-fixture', 'mutates', 'constant', 'unreachable', 'excluded'];
  const line = r => `${r.label.padEnd(30)} ` + keys.map(k => `${k}=${String(r.tally[k] || 0).padStart(4)}`).join('  ');
  [A, B, C].filter(Boolean).forEach(r => console.log(line(r)));

  console.log('\n=== oracle: known inputs, known outputs\n');
  oracle.checks.forEach(c => console.log((c.ok ? 'PASS  ' : 'FAIL  ') + c.name.padEnd(38) +
    (c.ok ? '' : `got ${JSON.stringify(c.got)}  want ${JSON.stringify(c.want)}`)));
  const bad = oracle.checks.filter(c => !c.ok).length;
  console.log(`\n${oracle.checks.length - bad}/${oracle.checks.length} oracle checks hold`);
  console.log('outcome tally from the fixture:', JSON.stringify(oracle.outcomes));
  if (oerr.length) console.log('page errors during the oracle:', oerr.slice(0, 3));
  fs.writeFileSync('synthetic_probe_results.json', JSON.stringify({ A: A.tally, B: B.tally, C: C && C.tally, oracle }, null, 1));
  await b.close();
})();
