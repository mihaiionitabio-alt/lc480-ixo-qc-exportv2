/* Synthetic decoded-run fixture — no laboratory data of any kind.
 * ---------------------------------------------------------------
 * The SHAPE is taken from the decoded model (key names and types); every VALUE is invented
 * and deterministic, so the expected outputs are known before the page is asked for them.
 * Nothing here is derived from a real sample, control, instrument or measurement.
 *
 * Layout of the invented 96-well plate (12 columns):
 *   pos  0..39  20 samples SYN-001..SYN-020, two replicates each
 *   pos 40,41   SYN-NTC          no template
 *   pos 42,43   SYN-NEG          matrix negative
 *   pos 44,45   SYN-CRM-A 01.01.2026   reference-material extract, with its extraction date
 *   pos 46      SYN-EXTRA        single well
 *   pos 47..86  empty wells: flat noise only, amplitude ~2 fluorescence units
 * Two deliberate anomalies, and only two:
 *   A  pos 40, channel 0: a clean rising curve with NO result row  -> no-template position with signal
 *   B  pos 46, channel 1: a clean rising curve with NO result row  -> channel carries no result
 * Plus one deliberate container-integrity mismatch.
 */
(function () {
  const CYCLES = 45, COLS = 12, ROWS = 8;
  /* deterministic PRNG: the same fixture every run, on every machine */
  let seed = 20260923;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  const sigmoid = (cq, amp, base) => Array.from({ length: CYCLES }, (_, i) =>
    +(base + amp / (1 + Math.exp(-((i + 1) - cq) / 1.2)) + (rnd() - 0.5) * 2).toFixed(3));
  const flat = base => Array.from({ length: CYCLES }, (_, i) =>
    +(base + i * 0.02 + (rnd() - 0.5) * 1.2).toFixed(3));           /* drift ≈ 2 units over the run */

  const well = (pos, ch) => ({ row: Math.floor(pos / COLS), col: pos % COLS });
  const wellName = pos => "ABCDEFGH"[Math.floor(pos / COLS)] + String(pos % COLS + 1).padStart(2, "0");

  /* ---- the plan: what each position is, and what each channel should report ---- */
  const TARGETS = [{ ch: 0, name: "SYN-T1", filter: "CH-A", comb: "440-488" },
                   { ch: 1, name: "SYN-REF", filter: "CH-B", comb: "465-510" }];
  const plan = [];
  for (let s = 1; s <= 20; s++) {
    const id = "SYN-" + String(s).padStart(3, "0");
    for (let rep = 0; rep < 2; rep++) {
      const pos = (s - 1) * 2 + rep;
      let t1;                                        /* the target's Cq for this replicate */
      if (s <= 5) t1 = 30.00;                        /* clearly positive */
      else if (s <= 18) t1 = null;                   /* no crossing: reported as undetermined */
      else if (s === 19) t1 = 39.00;                 /* between the late limit (38) and the cut-off (40) */
      else t1 = rep === 0 ? 30.00 : 31.50;           /* replicate spread 1.5 Cq */
      plan.push({ pos, name: id, role: "", type: "qsUnknown", cq: { 0: t1, 1: 24.00 } });
    }
  }
  plan.push({ pos: 40, name: "SYN-NTC", type: "qsNoTemplate", cq: { 0: null, 1: null } });
  plan.push({ pos: 41, name: "SYN-NTC", type: "qsNoTemplate", cq: { 0: null, 1: null } });
  plan.push({ pos: 42, name: "SYN-NEG", type: "qsNegative", cq: { 0: null, 1: 24.00 } });
  plan.push({ pos: 43, name: "SYN-NEG", type: "qsNegative", cq: { 0: null, 1: 24.00 } });
  plan.push({ pos: 44, name: "SYN-CRM-A 01.01.2026", type: "qsPositive", cq: { 0: 32.00, 1: 24.00 } });
  plan.push({ pos: 45, name: "SYN-CRM-A 01.01.2026", type: "qsPositive", cq: { 0: 32.00, 1: 24.00 } });
  plan.push({ pos: 46, name: "SYN-EXTRA", type: "qsUnknown", cq: { 0: 28.00, 1: 24.00 } });

  const ANOMALY = [{ pos: 40, ch: 0 }, { pos: 46, ch: 1 }];        /* rising curve, result withheld */
  const isAnomaly = (pos, ch) => ANOMALY.some(a => a.pos === pos && a.ch === ch);

  /* ---- build the model ---- */
  const wells = [], allCurves = {}, plate = {};
  plan.forEach(p => {
    plate[p.pos] = { pos: p.pos, name: p.name, sampleId: "", notes: "", replicateOf: null, subsets: [],
                     channels: { 0: { sampleType: p.type, targetName: "SYN-T1", targetType: "dtTarget" },
                                 1: { sampleType: p.type, targetName: "SYN-REF", targetType: "dtReference" } } };
    TARGETS.forEach(t => {
      const cq = p.cq[t.ch];
      const rising = cq !== null || isAnomaly(p.pos, t.ch);
      allCurves[`${t.ch}|${p.pos}`] = { channel: t.ch, pos: p.pos,
        curve: rising ? sigmoid(cq === null ? 31 : cq, 3000, 500) : flat(500),
        amplitude: rising ? 3000 : 2 };
      if (isAnomaly(p.pos, t.ch)) return;                          /* result deliberately withheld */
      wells.push({ kind: "quant", well: wellName(p.pos), pos: p.pos, ...well(p.pos, t.ch),
        sample: p.name, sampleId: "", notes: "", target: t.name,
        analysis: "SYN analysis — " + t.name, analysisShort: t.name, analysisUid: "syn:" + t.name,
        analysisKind: "absquant", analysisGroup: "", analysisGroupName: "",
        channel: t.ch, filterName: t.filter, filterComb: t.comb,
        instrType: p.type, instrRole: "", givenConc: "", targetName: t.name,
        targetType: t.ch ? "dtReference" : "dtTarget", subsetsOfWell: [],
        IsIncluded: "true", manual: "", warnCodes: "", warnDesc: "",
        CpRaw: cq, Cp: cq, callCode: cq === null ? 0 : 1, call: cq === null ? "Negative" : "Positive",
        curve: allCurves[`${t.ch}|${p.pos}`].curve,
        CpUncertain: "", CpState: cq === null ? "Undetermined" : "",
        CrossingPointStatus: cq === null ? "Undetermined" : "",
        CalcConc: "", ConcStatus: "", StandardConc: "", CalcConcUnc: "" });
    });
  });
  for (let pos = 47; pos <= 86; pos++) {                            /* empty wells: noise only */
    TARGETS.forEach(t => { allCurves[`${t.ch}|${pos}`] = { channel: t.ch, pos, curve: flat(500), amplitude: 2 }; });
  }

  const run = {
    file: "SYNTHETIC_FIXTURE_001.ixo", sourcePath: "SYNTHETIC_FIXTURE_001.ixo", sourceArchive: null, zip: null,
    platform: "LightCycler 480", eds: null, isTemplate: false,
    meta: { name: "SYNTHETIC FIXTURE 001", Created: "2026-01-02T08:00:00", RunCreated: "2026-01-02T08:00:00",
            StartTime: "2026-01-02T08:05:00", EndTime: "2026-01-02T09:20:00", LastModified: "2026-01-02T09:40:00",
            CreatedByName: "SYN-OPERATOR", Technician: "SYN-OPERATOR", SWVersion: "SYN 1.0",
            InstrumentName: "SYN-INSTRUMENT-1", SerialNumber: "SYN-0001", sourceBytes: 123456 },
    wells, tmWells: [], genoResults: [], rqResults: [], otherResults: [], allCurves, plate,
    subsets: [], nCycles: CYCLES, amplificationCycles: CYCLES, acquisitionCycles: CYCLES,
    meltAcquisitionPoints: 0, acqStats: [], acqError: null,
    protocol: { stages: [], filters: [],
      channels: [{ name: "CH-A", ex: 440, em: 488, active: true }, { name: "CH-B", ex: 465, em: 510, active: true }] },
    acqMelt: null, acqSegments: [], acqAcquisitions: CYCLES, acqScalingFactors: [],
    identities: {}, duplicates: 0, namedPositions: plan.length, maxPos: 86, cols: COLS, rows: ROWS,
    blockId: "SYN-BLOCK-1", kinds: ["absquant"],
    format: { signature: "SYN", version: "1" },
    /* integrity is set per variant below: a container mismatch makes the profile reject the
       whole run, and "Invalid run" then overrides every sample outcome. One anomaly per
       fixture, or the known output stops being knowable. */
    integrity: { kind: "ixo", stored: "$11111111-22222222-33333333-44444444",
                 computed: "$11111111-22222222-33333333-44444444", ok: true, note: "synthetic, matching" },
    analyses: TARGETS.map((t, i) => ({ name: "SYN analysis — " + t.name, shortName: t.name, uid: "syn:" + t.name,
      kind: "absquant", kindLabel: "Absolute Quantification", cls: "Synthetic", subsetName: t.name,
      calcState: "analysed", channelIdx: t.ch, channelName: t.filter, filterName: t.filter, filterComb: t.comb,
      cpMethod: "2nd Derivative Maximum", cccEnabled: false, ccNote: "",
      created: "2026-01-02T09:30:00", modified: "2026-01-02T09:35:00", createdBy: "SYN-OPERATOR", modifiedBy: "SYN-OPERATOR",
      nResults: wells.filter(w => w.channel === t.ch).length, channelMismatch: null, channelSignal: null,
      stdCurve: null, settings: {}, quantStats: [] }))
  };

  /* ---- the profile this fixture is designed for ---- */
  const profile = () => {
    const base = SOP_PRESETS.generic();
    return Object.assign(base, {
      name: "SYNTHETIC screening profile", version: "1.0",
      targets: [{ match: "SYN-REF", kind: "reference", cqMax: 40, cqLate: 36, quantMin: "", lateOutcome: "Inconclusive" },
                { match: "*", kind: "target", cqMax: 40, cqLate: 38, quantMin: "", lateOutcome: "Repeat" }],
      controls: [{ name: "No-template control", matchBy: "name", match: "SYN-NTC", expect: "negative",
                   cqLo: "", cqHi: "", targets: "*", minPerRun: 1, onFail: "reject" },
                 { name: "Matrix negative", matchBy: "name", match: "SYN-NEG", expect: "negative",
                   cqLo: "", cqHi: "", targets: "SYN-T1", minPerRun: 1, onFail: "reject" },
                 { name: "Reference material", matchBy: "name", match: "SYN-CRM*", expect: "positive",
                   cqLo: "", cqHi: "", targets: "*", minPerRun: 1, onFail: "reject" }],
      replicates: { min: 2, positiveMin: 2, partialOutcome: "Inconclusive", maxSd: 0.5, sdOutcome: "Repeat" }
    });
  };

  /* ---- what the page must produce from it ---- */
  const expect = {
    runs: 1,
    wells: wells.length,                       /* 47 positions x 2 channels, minus the 2 withheld */
    curves: Object.keys(allCurves).length,
    integrityMismatches: { clean: 0, integrity: 1 },
    risingCurveFindings: 2,                    /* exactly the two anomalies */
    risingCurveErrors: 1,                      /* the no-template position */
    emptyWellsFlagged: 0,                      /* 40 noise wells must not be flagged */
    undeterminedRows: wells.filter(w => w.CpRaw === null).length,
    cqZeroRows: 0,                             /* Number(null) must never become a crossing at 0 */
    sampleGroupsOfTarget: 21,                  /* SYN-001..020 plus SYN-EXTRA */
    positiveSamples: 5,                        /* SYN-001..005 */
    negativeSamples: 13,                       /* SYN-006..018 */
    /* SYN-019 late, SYN-020 replicate spread, and SYN-EXTRA because a SINGLE well cannot
       satisfy a profile that requires two positive replicates. That third one is the point
       of including a single-well sample: the rule must bite. */
    repeatSamples: 3,
    flaggedWells: ["D05", "D11"],              /* pos 40 and pos 46 */
    runStatusWithBadIntegrity: "Invalid run",
    meanCqOfPositiveTarget: 30.00, referenceCq: 24.00
  };

  /* Variants: exactly one thing differs between them, so each has a known output.
       clean      - integrity matches; sample outcomes are assertable
       integrity  - the container checksum does not match; the profile rejects the run   */
  const variant = name => {
    const r = JSON.parse(JSON.stringify(run));
    r.wells.forEach((w, i) => { w.curve = run.wells[i].curve; });      /* keep the arrays shared */
    r.allCurves = run.allCurves;
    if (name === "integrity") {
      r.file = "SYNTHETIC_FIXTURE_002.ixo"; r.meta.name = "SYNTHETIC FIXTURE 002";
      r.integrity = { kind: "ixo", stored: "$11111111-22222222-33333333-44444444",
                      computed: "$55555555-66666666-77777777-88888888", ok: false, note: "synthetic mismatch" };
    }
    return r;
  };

  window.SYNTH = { run, variant, profile, expect };
  return window.SYNTH;
})();
