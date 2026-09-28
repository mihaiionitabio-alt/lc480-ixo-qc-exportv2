}
function selImageItems(){
  return (typeof GRAPHS==="undefined"?[]:GRAPHS).map(g=>({
    id:"img:"+g.id,kind:"image",group:g.group||"Figures",title:g.title||g.id,
    note:g.note||"",scope:g.scope||"all",
    ready:()=>RUNS.length>0,
    figure:()=>{const c=selGraphContext(g);const res=g.render(c);return {svg:res.svg,rows:res.rows||[]};}
  }));
}
function selDataItems(){
  const csv=rows=>toCSV(uniq(rows.flatMap(Object.keys)).map(k=>({key:k,label:k})),rows);
  const item=(id,title,note,ready,rows,file)=>({id:"data:"+id,kind:"data",group:"Tables",title,note,
    ready,rows,file:file||(id+".csv"),text:()=>csv(rows())});
  const L=[];
  L.push(item("cq_values","Stored Cq values",
    "One row per stored result with well, sample, target, role and call.",
    ()=>RUNS.length>0,()=>allWellRows()));
  L.push(item("melting_peaks","Melting peaks",
    "One row per stored peak with temperature, area, width and height.",
    ()=>tmRows().length>0,()=>tmRows()));
  L.push(item("experiment_settings","Experiment settings",
    "Every setting read out of the container, with the property it came from.",
    ()=>RUNS.length>0,()=>derivedSettings()));
  L.push(item("plate_map","Plate map",
    "The plate as the file describes it: position, sample, target and role.",
    ()=>RUNS.length>0,()=>RUNS.flatMap(r=>plateMapRows(r,""))));
  L.push(item("statistics","Statistics",
    "Per target and group: counts, mean Cq, spread and detection.",
    ()=>RUNS.length>0,()=>reviewStatisticsRows()));
  L.push(item("runs_and_qc","Runs and quality control",
    "One row per run with its profile answer and the reason behind it.",
    ()=>RUNS.length>0,()=>reviewRunRows(reviewForensicEvents())));
  L.push(item("forensic_log","Forensic findings",
    "Every finding with its area, severity and the evidence behind it.",
    ()=>RUNS.length>0,()=>reviewForensicEvents()));
  L.push(item("control_charts","Control chart points",
    "The plotted points of the control series with their limits.",
    ()=>RUNS.length>0,()=>reviewControlSeries("root").flatMap(s=>s.points.map(p=>Object.assign({series:s.sample,category:s.category,target:s.target},p)))));
  L.push(item("amplification_curves","Amplification curves",
