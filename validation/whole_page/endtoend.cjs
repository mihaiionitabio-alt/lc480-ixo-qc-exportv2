/* End-to-end exercise: with the corpus loaded, visit every tab, every review sub-view,
 * draw every graph, build every console view and run every export builder with the
 * download path stubbed. Records what each step produced and every page error. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const corpus = fs.readdirSync('corpus').sort().map(f => path.resolve('corpus', f));
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  await p.goto('file://' + path.resolve('prod.html'));
  await p.evaluate(() => document.querySelector('nav button[data-tab="load"]').click());
  await p.setInputFiles('#file', corpus);
  await p.waitForFunction(() => !document.querySelector('#read').disabled, null, { timeout: 120000 });
  await p.click('#read');
  await p.waitForFunction(() => /Read \d+ run/.test(document.querySelector('#readmsg').innerText), null, { timeout: 600000 });

  const r = await p.evaluate(() => {
    const out = { tabs: {}, reviewViews: {}, graphs: {}, consoleViews: {}, exports: {}, downloads: [] };
    const realDownload = window.download;
    window.download = (name, data) => { out.downloads.push({ name, bytes: (data && (data.length || data.size)) || 0 }); };
    const realCreate = URL.createObjectURL; URL.createObjectURL = () => 'blob:probe';
    const realClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {};

    for (const t of ['load','sop','results','panel','graphs','review','export','integrity']) {
      try { showTab(t); out.tabs[t] = document.querySelector('#tab-' + t) ? 'rendered' : 'rendered (no panel id)'; }
      catch (e) { out.tabs[t] = 'THREW: ' + e.message; }
    }
    showTab('review');
    for (const v of ['overview','plate','compare','statistics','controls','runs','curves','instrument']) {
      const btn = document.querySelector(`[data-review="${v}"]`);
      try { if (btn) { btn.click(); out.reviewViews[v] = 'rendered'; } else out.reviewViews[v] = 'absent'; }
      catch (e) { out.reviewViews[v] = 'THREW: ' + e.message; }
    }
    showTab('graphs');
    try {
      (GRAPHS || []).forEach(g => {
        try { const n = typeof renderGraph === 'function' ? renderGraph(g) : null; out.graphs[g.id || g.name || 'graph'] = 'drawn'; }
        catch (e) { out.graphs[g.id || g.name || 'graph'] = 'THREW: ' + e.message; }
      });
    } catch (e) { out.graphs.__ = 'THREW: ' + e.message; }
    try {
      for (const k of Object.keys(MG_VIEWS || {})) {
        try { const v = MG_VIEWS[k]; const items = typeof v === 'function' ? v() : (v.build ? v.build() : null);
              out.consoleViews[k] = Array.isArray(items) ? items.length + ' items' : String(typeof items); }
        catch (e) { out.consoleViews[k] = 'THREW: ' + e.message; }
      }
    } catch (e) { out.consoleViews.__ = 'THREW: ' + e.message; }
    showTab('export');
    document.querySelectorAll('#tab-export button, [data-export]').forEach(btn => {
      const label = (btn.textContent || btn.getAttribute('data-export') || 'button').trim().slice(0, 60);
      const before = out.downloads.length;
      try { btn.click(); out.exports[label] = (out.downloads.length - before) + ' file(s)'; }
      catch (e) { out.exports[label] = 'THREW: ' + e.message; }
    });
    window.download = realDownload; URL.createObjectURL = realCreate; HTMLAnchorElement.prototype.click = realClick;
    return out;
  });
  r.pageErrors = errs;
  fs.writeFileSync('endtoend.json', JSON.stringify(r, null, 1));
  const bad = s => Object.entries(s).filter(([, v]) => String(v).startsWith('THREW'));
  console.log('tabs', Object.keys(r.tabs).length, 'failing', bad(r.tabs).length);
  console.log('review views', Object.keys(r.reviewViews).length, 'failing', bad(r.reviewViews).length);
  console.log('graphs', Object.keys(r.graphs).length, 'failing', bad(r.graphs).length);
  console.log('console views', Object.keys(r.consoleViews).length, 'failing', bad(r.consoleViews).map(x => x[0]).join(','));
  console.log('export buttons', Object.keys(r.exports).length, 'downloads', r.downloads.length, 'failing', bad(r.exports).length);
  console.log('pageErrors', errs.length);
  await b.close();
})();
