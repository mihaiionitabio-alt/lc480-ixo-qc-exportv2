function wireGraphs(){
  ["#g-graph","#g-run","#g-metric","#g-signal","#g-log","#g-colourby","#g-level","#g-control"].forEach(id=>$(id).onchange=()=>{GRAPH_STATE.userTarget=false;renderGraphs();});
  $("#g-target").onchange=()=>{GRAPH_STATE.userTarget=true;renderGraphs();};
  $("#g-dl-svg").onclick=()=>{if(GRAPH_STATE.last)download(graphFileBase()+".svg",graphSvgText(),"image/svg+xml");};
  $("#g-dl-png").onclick=graphPng;
  $("#g-dl-csv").onclick=()=>{const L=GRAPH_STATE.last;if(L&&L.res.rows&&L.res.rows.length)withExportNames(()=>{const r=L.g.render(Object.assign({},L.c,{run:RUNS[L.c.ri]}));download(graphFileBase()+".csv",csvOf(r.rows),"text/csv");});};
  $("#g-dl-all").onclick=async()=>{
    const button=$("#g-dl-all"),label=button.textContent;button.disabled=true;button.textContent="Preparing graphs…";
    try{await new Promise(r=>setTimeout(r,0));withExportNames(graphAllZip);}
    catch(e){console.error(e);alert("Graph export failed: "+e.message);}
    finally{button.disabled=false;button.textContent=label;}
  };
}
