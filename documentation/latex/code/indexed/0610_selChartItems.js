  L.push(item("relative_quantification","Relative quantification",
    "Relative quantification rows read from the stored analysis.",
    ()=>RUNS.some(r=>(r.rqResults||[]).length),()=>rqRows()));
  L.push(item("multicomponent_raw","Multicomponent raw values",
    "Raw multicomponent signal rows from exchange containers.",
    ()=>RUNS.some(r=>r.eds),()=>edsSignalRows()));
  L.push(item("experiment_meta","Experiment metadata",
    "Metadata fields read from every loaded experiment.",
    ()=>RUNS.length>0,()=>metaRows()));
  L.push(item("sample_comparison","Sample comparison",
    "Paired sample comparison rows for the first two loaded runs.",
    ()=>RUNS.length>1,()=>sampleComparisonRows(RUNS[0],RUNS[1],200)));
  L.push(item("rising_curves","Rising curves without a channel result",
    "Curve events retained for review when the same channel has no stored result.",
    ()=>RUNS.length>0,()=>risingCurveRows()));
