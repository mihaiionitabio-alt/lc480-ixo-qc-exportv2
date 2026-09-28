    "The fluorescence of every well, one row per cycle.",
    ()=>RUNS.some(r=>(r.wells||[]).some(w=>w.curve&&w.curve.length)),
    ()=>RUNS.flatMap(run=>(run.wells||[]).filter(w=>w.curve&&w.curve.length)
      .flatMap(w=>w.curve.map((v,i)=>({experiment:runName(run),well:w.well,sample:w.sample||"",target:w.target||"",cycle:i+1,fluorescence:v}))))));
  L.push(item("sop_answers","Profile answers",
    "What the laboratory profile concluded for every sample.",
    ()=>RUNS.length>0,()=>sopSampleRows("",true)));
