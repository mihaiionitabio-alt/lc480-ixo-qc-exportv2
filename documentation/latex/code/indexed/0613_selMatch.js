    ()=>RUNS.length>0,()=>sopCriteriaRows()));
  L.push(item("sop_runs","SOP run decisions",
    "One row per run with profile status and counts.",
    ()=>RUNS.length>0,()=>sopRunRows()));
  const recordRows=()=>RUNS.flatMap((run,index)=>Object.entries(instrumentRecordTables(run)).flatMap(([table,rows])=>(rows||[]).map(row=>({run:index+1,experiment:runName(run),table,...row}))));
  L.push({id:"rec:instrument_records",kind:"data",group:"Instrument records",title:"Instrument records",note:"Metadata, protocol, channels, subsets, analyses and statistics.",ready:()=>RUNS.length>0,rows:recordRows,file:"instrument_records.csv",text:()=>csv(recordRows())});
  return L;
}
const SEL_OPTION_RULES=Object.freeze({
  "img:curves":{target:"text",signal:["stored","drn"],log:["yes","no"]},
  "img:plate":{metric:["outcome","status","cq","end_fluorescence","background","amplitude"],target:"text"},
