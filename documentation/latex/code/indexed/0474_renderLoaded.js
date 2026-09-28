function renderLoaded(){
  const card=$("#loadedcard");
  if(!RUNS.length&&!PASTED){card.style.display="none";return;}
  card.style.display="";
  let h="";
  if(RUNS.length){
    h+=table([
      {key:"experiment",label:"Experiment"},{key:"platform",label:"Instrument family"},{key:"plate",label:"Plate"},
      {key:"cycles",label:"Cycles",n:1},{key:"analyses",label:"Analyses",n:1},
      {key:"quantification_results",label:"Cq results",n:1},
      {key:"curves_decoded",label:"Curves",n:1},
      {key:"melting_results",label:"Tm results",n:1},
      {key:"channels",label:"Active channels"},{key:"instrument",label:"Instrument"}
    ],metaRows().slice(0,LOADED_LIMIT));
    if(RUNS.length>LOADED_LIMIT)h+=`<div class="toolbar"><span class="hint">${LOADED_LIMIT} of ${RUNS.length} runs listed.</span><button class="ghost" id="loaded-more" type="button">Show all ${RUNS.length}</button></div>`;
    const tpl=RUNS.filter(r=>r.isTemplate);
    if(tpl.length)h+=`<div class="notice warn">${tpl.map(r=>esc(r.file)).join(", ")}: template or unrun experiment — plate setup, protocol and analysis settings only.</div>`;
    const noCurve=RUNS.reduce((s,r)=>s+r.wells.filter(w=>!w.curve).length,0);
    if(noCurve)h+=`<div class="notice warn">${noCurve} stored result(s) have no decoded amplification curve.
      Curve-based exports and checks will skip them.</div>`;
    const acqErr=RUNS.filter(r=>r.acqError);
    if(acqErr.length)h+=`<div class="notice bad">Fluorescence could not be read from
      ${acqErr.map(r=>esc(r.file)).join(", ")}: ${esc(acqErr[0].acqError)}. Cq values are still available.</div>`;
  }
  if(PASTED){
    h+=`<div class="notice ok">${PASTED.rows.length} Cq value(s) read from ${esc(PASTED.source)}.
      The inhibition test and the replicate checks will use these. Curve-based exports need an .ixo file.</div>`;
  }
  $("#loaded").innerHTML=h;
  const more=$("#loaded-more");if(more)more.onclick=()=>{LOADED_LIMIT=1e9;renderLoaded();localizeDOM($("#loadedcard"));};
}
