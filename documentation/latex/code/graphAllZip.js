function graphAllZip(){
  if(!RUNS.length)return;
  const ri=Number($("#g-run").value)||0,entries=[];
  GRAPHS.forEach(g=>{
    const targets=[""];
    const controls=(g.opts||[]).includes("control")
      ?SOP.controls.map((x,i)=>({i,x})).filter(({x})=>x.expect==="positive")
      :[{i:0,x:null}];
    targets.forEach(t=>controls.forEach(({i,x})=>{try{
      const c={g,ri,run:RUNS[ri],target:g.id==="curves"?(gTargets(RUNS[ri])[0]||""):t,metric:"outcome",signal:"stored",log:false,colourby:"outcome",level:"end",control:String(i)};
      const suffix=x?"_"+safeName(x.name||x.match||String(i)):"";
      const res=g.render(c);const base=(g.scope==="run"?"run_":"all_runs_")+g.id+suffix;
      entries.push({name:base+".svg",data:res.svg});
      if(res.rows&&res.rows.length)entries.push({name:base+".csv",data:csvOf(res.rows)});
    }catch(e){entries.push({name:g.id+"_error.txt",data:String(e.message)});}}));
  });
  entries.push({name:"sop_profile.json",data:sopJSON()});
  entries.push(...reviewBundleEntries());
  entries.push({name:"README.txt",data:`Graphs and review exports for ${runName(RUNS[ri])} (run-level) and all ${RUNS.length} loaded run(s) (cross-run).\nSOP profile ${SOP.name} v${SOP.version}, SHA-256 ${sopHash()}.\nEach graph .csv holds the numbers behind the .svg of the same name. The review/ folder contains the plate map, sample comparison, statistics, control-chart, runs/QC, amplification-curve and instrument-record exports.\n`});
  download(safeName(runName(RUNS[ri]))+"_graphs.zip",makeStoredZip(entries),"application/zip");
}