function exportCatalogueCore(){
  const one=RUNS.length===1?RUNS[0]:null;
  const items=[];
  items.push({
    title:"Cq values (CSV)",
    note:"Every stored crossing point with its well, sample, target, role and call. The plain table most downstream work starts from.",
    ready:()=>RUNS.length>0,
    run:()=>{
      const rows=allWellRows();
      const cols=Object.keys(rows[0]||{cq:1}).map(k=>({key:k,label:k}));
      download(baseName()+"_cq_values.csv",toCSV(cols,rows),"text/csv");
    }
  });
  items.push({
    title:"RDES table (TSV)",
    note:"Stored Cq beside the full amplification curve, one row per cycle and one file per analysis. The long-format table for scripts that expect tidy data.",
    ready:()=>RUNS.some(r=>r.wells.some(w=>w.curve)),
    run:()=>RUNS.forEach(r=>makeRDESTables(r).forEach(t=>download(t.file,t.data,"text/tab-separated-values")))
  });
  items.push({
    title:"RDML 1.4 — for LinRegPCR",
    note:"Version 1.4 with every dye declared. rdmlpython refuses LinRegPCR below 1.4, and raises KeyError on a target whose dye was never declared; both were checked by running it.",
    ready:()=>RUNS.some(r=>r.wells.some(w=>w.curve)),
    run:()=>RUNS.forEach(r=>download(safeName(r.meta.name||r.file)+".rdml",makeRDML(r),"application/zip"))
  });
  items.push({
    title:"qpcR curve table (CSV, wide)",
    note:"One file per analysis and one column per well, with the first column named Cycles exactly as pcrbatch() demands. Column names carry target and sample so replicate groups form with one sub().",
    ready:()=>RUNS.some(r=>r.wells.some(w=>w.curve)),
    run:()=>RUNS.forEach(r=>makeQpcrWideTables(r).forEach(t=>download(t.file,t.data,"text/csv")))
  });
  items.push({
    title:"Melting peaks (CSV)",
    note:"One row per stored peak with temperature, area, width, height, shoulder, raw call code and manual-edit flag. Wells without a peak remain as one blank row.",
    ready:()=>tmRows().length>0,
    run:()=>{const rows=tmRows();download(baseName()+"_melting_peaks.csv",
      toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows),"text/csv");}
  });
  items.push({
    title:"Experiment settings (CSV)",
    note:"Every setting the page could read out of the container, each with the property it came from. The same table shown on the Load tab.",
    ready:()=>RUNS.length>0,
    run:()=>{const n=derivedSettings();download(baseName()+"_experiment_settings.csv",
      toCSV([{key:"setting",label:"setting"},{key:"value",label:"value"},{key:"source",label:"read_from"}],n),"text/csv");}
  });
  items.push({
    title:"Everything, as one ZIP",
    note:"Every table above plus both scripts, so a whole experiment can be handed over in a single file.",
    ready:()=>RUNS.length>0,
    run:()=>bundleZip()
// … 3 more line(s): the complete code is at lines 8557–8559 of the HTML file