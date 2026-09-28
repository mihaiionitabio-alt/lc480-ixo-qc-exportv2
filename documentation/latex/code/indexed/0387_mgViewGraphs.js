function mgViewGraphs(){
  const out=[];
  if(!RUNS.length)return [mgIt({kind:"graph",sev:"none",pict:MG_PICT.graph,kindWord:"graphs",code:"G",
    title:"No run to draw",value:"0",unit:"runs",
    state:"The graphs are drawn from one decoded run at a time. Load an experiment file first.",
    actions:[{key:"3",label:"Open the graphs view on the page",cmd:"open page graphs"}]})];
  const ri=Math.min(Math.max(0,MG.run|0),RUNS.length-1);
  const run=RUNS[ri];
  out.push(mgIt({kind:"summary",sev:"ok",pict:MG_PICT.summary,kindWord:"graphs",code:"G",
    title:"Graphs for "+runName(run),value:String(GRAPHS.length),unit:"graphs",
    limits:`run ${ri+1} of ${RUNS.length} · ${uniq(GRAPHS.map(g=>g.group)).length} group(s)`,
    state:"Each graph below is drawn here with the limits of the active profile. Use Next run to change the experiment.",
    evidence:uniq(GRAPHS.map(g=>g.group)).join(" · "),
    rows:GRAPHS.slice(0,14).map(g=>[g.group,g.title.slice(0,54)]),
    actions:RUNS.length>1?[{key:"3",label:"Next run",cmd:"next run"},
                           {key:"4",label:"Open the graphs view on the page",cmd:"open page graphs"}]
                         :[{key:"3",label:"Open the graphs view on the page",cmd:"open page graphs"}]}));
  GRAPHS.forEach((g,i)=>out.push(mgIt({kind:"graph",sev:"none",pict:MG_PICT.graph,kindWord:g.group,
    code:"G"+(i+1),title:g.title,value:"",unit:"",
    limits:g.scope==="run"?runName(run):"all loaded runs",
    state:g.note||"",evidence:`graph ${i+1} of ${GRAPHS.length} · drawn with ${SOP.name} v${SOP.version}`,
    graphId:g.id,runIndex:ri,
    rows:[["Group",g.group],["Drawn from",g.scope==="run"?"one run":"every loaded run"],
          ["Run",runName(run)],["Options",(g.opts||[]).join(", ")||"none"],
          ["Profile",`${SOP.name} v${SOP.version}`],["Graph",`${i+1} of ${GRAPHS.length}`]],
    actions:[{key:"3",label:"Draw the graph",cmd:"chart"},
             {key:"4",label:"Open the graphs view on the page",cmd:"open page graphs"}]})));
  return out;
}
