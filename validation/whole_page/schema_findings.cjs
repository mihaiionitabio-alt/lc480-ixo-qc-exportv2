/* Evidence for the RDML 1.3 schema conformance findings. Everything printed in the
 * findings chapter is produced here, from the files themselves. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  await p.goto('file://' + path.resolve('prod.html'));
  const load = d => Object.fromEntries(fs.readdirSync(d).filter(f => /\.rdml$/i.test(f))
    .map(f => [f, fs.readFileSync(path.join(d, f)).toString('base64')]));
  const real = load('rdml'), synth = load('synth');

  const out = await p.evaluate(async ({ real, synth }) => {
    const dec = s => { const bin = atob(s), u = new Uint8Array(bin.length);
                       for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
    const parse = async (name, b64) => {
      const u = dec(b64); const ents = await rdmlEntries(u.buffer, name);
      const xml = new TextDecoder().decode(ents.find(e => /rdml_data\.xml$/i.test(e.name)).bytes);
      return { runs: rdmlParse(xml, name, u), xml };
    };
    const R = { vocabulary: {}, sentinel: {}, format: {}, perTarget: null, intake: {}, md5: {} };

    /* F-1  the sample-type vocabulary */
    R.vocabulary.inCode = Object.keys(RDML_SAMPLE_ROLE);
    R.vocabulary.mapping = { ...RDML_SAMPLE_ROLE };
    R.vocabulary.inSchema = ['unkn','ntc','nac','std','ntp','nrt','pos','opt'];
    R.vocabulary.missing = R.vocabulary.inSchema.filter(k => !(k in RDML_SAMPLE_ROLE));
    R.vocabulary.notInSchema = R.vocabulary.inCode.filter(k => !R.vocabulary.inSchema.includes(k));

    /* F-2  the -1.0 Not Available sentinel, on the real corpus */
    for (const [name, b64] of Object.entries(real)) {
      const { runs } = await parse(name, b64);
      const w = runs.flatMap(r => r.wells);
      R.sentinel[name] = {
        reactions: w.length,
        negativeCq: w.filter(x => typeof x.CpRaw === 'number' && x.CpRaw < 0).length,
        negativeCqCalledAnalysed: w.filter(x => typeof x.CpRaw === 'number' && x.CpRaw < 0 && x.call === 'Analysed').length,
        undetermined: w.filter(x => x.CpRaw === null).length,
        negativeN0: w.filter(x => x.rdml && x.rdml.N0 === -1).length,
        negativeAmpEff: w.filter(x => x.rdml && x.rdml.ampEff === -1).length,
        excluded: w.filter(x => x.IsIncluded === 'false').length
      };
    }
    /* F-3/F-4/F-5  plate formats and roles, on purpose-built files */
    for (const [name, b64] of Object.entries(synth)) {
      try {
        const { runs } = await parse(name, b64); const r = runs[0];
        const rec = { runs: runs.length, rows: r.rows, cols: r.cols, maxPos: r.maxPos, wells: r.wells.length,
          integrityNote: r.integrity.note,
          table: r.wells.map(x => ({ well: x.well, pos: x.pos, sample: x.sample, target: x.target,
                                     declaredType: x.instrType, role: x.instrRole, cq: x.CpRaw, call: x.call })) };
        if (name === 'per_target_type.rdml') R.perTarget = rec; else R.format[name] = rec;
      } catch (e) { R.format[name] = { error: e.message }; }
    }
    /* F-7  the MD5 the format defines, and the MD5 the page already carries */
    R.md5.pageHasMD5 = (typeof EDS !== 'undefined' && typeof EDS.MD5 === 'function');
    R.md5.integrityNoteForFileWithHash = R.format['md5_id.rdml'] && R.format['md5_id.rdml'].integrityNote;
    return R;
  }, { real, synth });

  /* F-6  what the intake accepts */
  const src = fs.readFileSync('prod.html', 'utf8');
  out.intake = {
    acceptAttribute: (src.match(/accept="[^"]*ixo[^"]*"/) || [''])[0],
    extensionTests: [...new Set((src.match(/\/\\\.(?:ixo|eds|edt|rdml|rdm|xml)\$\/i/g) || []))],
    rejectionMessage: (src.match(/not an \.ixo[^`"]*/) || [''])[0]
  };
  out.corpus = fs.readdirSync('rdml').map(f => ({ file: f, bytes: fs.statSync(path.join('rdml', f)).size, sha256: sha(path.join('rdml', f)) }));
  out.synthetic = fs.readdirSync('synth').map(f => ({ file: f, bytes: fs.statSync(path.join('synth', f)).size, sha256: sha(path.join('synth', f)) }));
  out.pageErrors = errs;
  fs.writeFileSync('schema_findings.json', JSON.stringify(out, null, 1));
  console.log('vocabulary missing from the code:', out.vocabulary.missing.join(', '));
  console.log('keys in the code that the schema does not define:', out.vocabulary.notInSchema.join(', '));
  for (const [k, v] of Object.entries(out.sentinel)) if (v.negativeCq) console.log('sentinel', k, JSON.stringify(v));
  console.log('free format wells:', out.format['free_format.rdml'] && out.format['free_format.rdml'].wells);
  console.log('page carries an MD5 implementation:', out.md5.pageHasMD5);
  console.log('pageErrors', errs.length);
  await b.close();
})();
