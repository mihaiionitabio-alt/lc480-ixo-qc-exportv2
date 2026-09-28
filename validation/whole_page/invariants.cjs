/* Invariant probes: the part a contract dossier cannot do.
 * A per-function contract check asks "did it return without throwing". None of the four
 * defects found on 23 September were contract violations - they were WRONG VALUES returned
 * by functions that never threw. An invariant probe states a property that must hold of the
 * values, and fails loudly when it does not.
 *
 *   node invariants.cjs <page.html> <folder> [maxFiles]
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const PAGE = path.resolve(process.argv[2]), DIR = process.argv[3], MAXF = Number(process.argv[4] || 6);
const files = fs.readdirSync(DIR).filter(f => /\.(ixo|eds)$/i.test(f)).slice(0, MAXF).map(f => path.join(DIR, f));

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto('file://' + PAGE);
  await p.evaluate(() => document.querySelector('nav button[data-tab="load"]').click());
  await p.setInputFiles('#file', files);
  await p.waitForFunction(() => !document.querySelector('#read').disabled, null, { timeout: 120000 });
  await p.click('#read');
  await p.waitForFunction(() => /Read \d+ run/.test(document.querySelector('#readmsg').innerText), null, { timeout: 300000 });

  const res = await p.evaluate(() => {
    const out = [];
    const check = (name, why, fn) => { try { const r = fn(); out.push({ name, why, ok: r === true || r === undefined, note: r === true || r === undefined ? '' : String(r).slice(0, 140) }); }
                                       catch (e) { out.push({ name, why, ok: false, note: 'THREW ' + String(e.message).slice(0, 120) }); } };
    const J = v => JSON.stringify(v);

    check('forensic scan is pure', 'two identical calls must give identical events, or a cache is leaking state',
      () => J((reviewForensicEvents() || []).map(e => [e.severity, e.area, e.finding])) === J((reviewForensicEvents() || []).map(e => [e.severity, e.area, e.finding])) || 'second call differed');

    check('chart computation is idempotent', 'ccCompute must not depend on how often it has run',
      () => { const d = CC_CHARTS[0], k = ccInstruments()[0]; if (!k) return true; const r = ccRowsFor(k.key);
              const a = ccCompute(d, r, ''), c = ccCompute(d, r, '');
              return J(a.pts.map(x => [x.y, x.flags])) === J(c.pts.map(x => [x.y, x.flags])) || 'differed between calls'; });

    check('profile canonical form is stable', 'the profile hash is exported with every result; it must round-trip',
      () => sopCanonical(JSON.parse(JSON.stringify(SOP))) === sopCanonical(SOP) || 'round trip changed the canonical form');

    check('every flagged control point is outside its own limit', 'a red point inside the interval is the 22 September defect',
      () => { const k = ccInstruments()[0]; if (!k) return true; const rows = ccRowsFor(k.key); const bad = [];
              CC_CHARTS.forEach(d => { let r; try { r = ccCompute(d, rows, ''); } catch (e) { return; }
                (r.pts || []).forEach((pt, i) => { if (!pt.flags || !pt.flags.length || pt.pre) return;
                  if (!/outside|limit|spec/i.test(pt.flags.join(' '))) return;
                  const own = pt.sigHi !== undefined ? (pt.sigHi ? pt.y : pt.y2) : pt.y;
                  const lim = pt.sigHi !== undefined ? pt.ucl : (own > pt.cl ? pt.ucl : pt.lcl);
                  if (Number.isFinite(own) && Number.isFinite(lim) && Math.abs(own) <= Math.abs(lim)) bad.push(d.code + '#' + i); }); });
              return bad.length ? bad.length + ' flagged point(s) inside their own limit: ' + bad.slice(0, 5).join(', ') : true; });

    check('no rising-curve finding has an answer in its own channel', 'the 23 September linkage rule',
      () => { const bad = [];
              RUNS.forEach((run, ri) => { const ans = new Set();
                [...(run.wells || []), ...(run.tmWells || []), ...(run.genoResults || []), ...(run.otherResults || [])]
                  .forEach(w => { if (typeof resultAnswers === 'function' && resultAnswers(w)) ans.add(Number(w.channel) + '|' + Number(w.pos)); });
                orphanCurveCandidates(run).forEach(o => { if (ans.has(o.channel + '|' + o.pos)) bad.push(run.file + ' ' + o.well); }); });
              return bad.length ? bad.length + ' candidate(s) already answered: ' + bad.slice(0, 3).join(', ') : true; });

    check('no stored Cq is read as a crossing at cycle 0', 'Number(null) === 0, the round-2 defect',
      () => { const bad = []; RUNS.forEach(r => (r.wells || []).forEach(w => {
                if (typeof resultCq === 'function' && resultCq(w) === 0) bad.push(r.file + ' pos ' + w.pos); }));
              return bad.length ? bad.length + ' row(s) report Cq 0' : true; });

    check('cycle count never exceeds the largest stored Cq by an implausible margin', 'melt acquisitions counted as cycles',
      /* Read the Cq the way the page reads it. Number(null) and Number("") are both 0 and
         both pass Number.isFinite, so a completely negative run - every well undetermined,
         which is an ordinary screening result - reported "max Cq 0.0" and failed this check
         for no reason. The sentinel is null on QuantStudio and "" on the LightCycler. */
      () => { const bad = []; RUNS.forEach(r => {
                const cq = (r.wells || []).map(w => (typeof resultCq === 'function' ? resultCq(w) : null)).filter(v => v !== null);
                if (!cq.length || !Number.isFinite(r.nCycles)) return;
                if (r.nCycles > Math.max(...cq) * 2 + 10) bad.push(`${r.file}: ${r.nCycles} cycles, max Cq ${Math.max(...cq).toFixed(1)}`); });
              return bad.length ? bad.join(' | ') : true; });

    /* An invariant that a missing value can satisfy is not an invariant. The cycle check above
       returns early when nCycles is absent - which is exactly the melt-only case it was meant
       to catch - so the same property is stated a second way, against the Cq values alone. */
    check('no stored Cq exceeds the cycles it could have crossed in',
      'a "Cq" of 84.6 in a melt-only run is a melting temperature in the Cq field',
      () => { const bad = []; RUNS.forEach(r => {
                const cq = (r.wells || []).map(w => (typeof resultCq === 'function' ? resultCq(w) : null)).filter(v => v !== null);
                if (!cq.length) return;
                const ceiling = Number.isFinite(r.nCycles) && r.nCycles > 0 ? r.nCycles : 60;
                const over = cq.filter(v => v > ceiling);
                if (over.length) bad.push(`${r.file}: ${over.length} value(s) above ${ceiling}, max ${Math.max(...over).toFixed(1)}`); });
              return bad.length ? bad.join(' | ') : true; });

    check('a melt-only run stores no amplification result',
      'melt results must not be written into the quantification table',
      () => { const bad = []; RUNS.forEach(r => {
                const kinds = (r.kinds || []).join(',');
                if (!/\btm\b|melt/i.test(kinds) || /absquant|relquant/i.test(kinds)) return;
                if ((r.wells || []).length) bad.push(`${r.file}: ${(r.wells || []).length} quantification row(s) in a ${kinds} run`); });
              return bad.length ? bad.join(' | ') : true; });

    check('a module without crossings raises no missing-Cq finding',
      'endpoint genotyping, gene scanning, melt-curve genotyping and Tm calling report calls and '
      + 'temperatures, not crossings; "stored row with no Cq" is their normal state',
      () => { const bad = []; RUNS.forEach(r => {
                const kinds = (r.kinds || []).join(',');
                if (/absquant|relquant/.test(kinds)) return;
                const n = (typeof orphanCurveCandidates === 'function' ? orphanCurveCandidates(r) : [])
                  .filter(o => o.cls === 'result-without-cq' || o.cls === 'channel-not-analysed' || o.cls === 'position-not-analysed').length;
                if (n) bad.push(`${r.file} (${kinds}): ${n}`); });
              return bad.length ? bad.join(' | ') : true; });

    check('no analysis reports a raw numeric state', 'calcState must be a word, not a code',
      () => { const bad = []; RUNS.forEach(r => (r.analyses || []).forEach(a => { if (/^\d+$/.test(String(a.calcState || ''))) bad.push(r.file + ': ' + a.calcState); }));
              return bad.length ? bad.length + ' analysis state(s) are bare numbers, e.g. ' + bad[0] : true; });

    check('outcome counts conserve the interpreted rows', 'a summary that does not add up is not a summary',
      () => { const ev = sopEvaluateAll(); const rows = ev.flatMap(e => e.rows || []);
              const sum = [...new Set(rows.map(r => r.outcome))].reduce((n, o) => n + rows.filter(r => r.outcome === o).length, 0);
              return sum === rows.length || `sum ${sum} vs ${rows.length}`; });

    check('distinct findings never exceed raw events', 'aggregation can only reduce',
      () => { const raw = reviewEventsWithoutIntegrity() || []; const d = reviewDisplayFindings(raw);
              return d.length <= raw.length || `${d.length} distinct from ${raw.length} raw`; });

    check('every distinct finding accounts for all its events', 'no occurrence may be lost in grouping',
      () => { const raw = reviewEventsWithoutIntegrity() || []; const d = reviewDisplayFindings(raw);
              const n = d.reduce((a, g) => a + g.occurrences, 0);
              return n === raw.length || `occurrences ${n} vs raw ${raw.length}`; });

    check('integrity findings stay out of the review count', 'they belong to tab 8 only',
      () => { const ev = reviewEventsWithoutIntegrity() || [];
              const leak = ev.filter(e => /integrity/i.test(String(e.area || ''))).length;
              return leak ? leak + ' integrity event(s) leaked into the review list' : true; });

    check('exports do not change stored values', 'building a report must never touch the model',
      () => { const before = J(RUNS.flatMap(r => (r.wells || []).map(w => [w.pos, w.channel, w.CpRaw, w.call])));
              try { sopSampleRows('', true); sopInterpretationRows('', true); sopCriteriaRows(); sopRunRows(); metaRows(); } catch (e) { return 'export threw: ' + e.message.slice(0, 60); }
              return J(RUNS.flatMap(r => (r.wells || []).map(w => [w.pos, w.channel, w.CpRaw, w.call]))) === before || 'stored values changed'; });

    return out;
  });

  const bad = res.filter(r => !r.ok);
  res.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '\n        ' + r.note)));
  console.log(`\n${res.length - bad.length}/${res.length} invariants hold`);
  fs.writeFileSync('invariants_results.json', JSON.stringify({ total: res.length, passed: res.length - bad.length, checks: res }, null, 1));
  await b.close();
})();
