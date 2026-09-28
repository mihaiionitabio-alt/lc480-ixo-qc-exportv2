async function readStagedCore(task){
  const token=++APP_STATE.generation;setPhase("reading","read started");
  const msg=$("#readmsg");
  msg.innerHTML=`Reading ${STAGED.length} file(s)…`;
  RUNS=[];const failed=[];
  for(const [k,s] of STAGED.entries()){
    if(token!==APP_STATE.generation)return appReadSuperseded(msg);
    appTaskStep(task,k+1,s.name);
    if(STAGED.length>3&&k%3===0){msg.innerHTML=`Reading ${k+1} of ${STAGED.length}…`;await new Promise(r=>setTimeout(r,0));}
    try{
      if(s.kind==="rdml"){
        const entries=await rdmlEntries(s.bytes.buffer,s.archive);
        if(!rdmlIsContainer(entries))throw new Error(`${s.name}: not an RDML container (no rdml_data.xml)`);
        const ent=entries.find(e=>/^rdml_data\.xml$/i.test(e.name));
        const produced=rdmlParse(new TextDecoder().decode(ent.bytes),s.name,s.bytes);
        produced.forEach(r=>{validateRunBoundary(r,s.name);RUNS.push(r);});
      }else{
        const source=s.kind==="eds"?s:{...s,text:s.text||new TextDecoder("utf-8").decode(s.bytes)};
        const r=source.kind==="eds"?await decodeEds(source):await decodeIxo(source,"auto");
        validateRunBoundary(r,s.name);await ccExtractOnLoad(r,source);RUNS.push(r);
      }
      if(token!==APP_STATE.generation)return appReadSuperseded(msg);}
    catch(err){failed.push(`${s.name}: ${err.message}`);appError("decode",err,{file:s.name,index:k});}
  }
  if(token!==APP_STATE.generation)return appReadSuperseded(msg);
  const priority=applyRawFilePriority(RUNS);
  if(priority.superseded.length)appNotice("rdml",`${priority.superseded.length} exchange export(s) superseded by the instrument's own file`);
  assignRoles(RUNS);
  sopMaybeSelectScDefault();
  PSEUDO_MAP=null;
  PASTED=null;
  setPhase(RUNS.length?"ready":"idle","read complete");
  msg.innerHTML=RUNS.length
    ? `<div class="notice ok">Read ${RUNS.length} run(s): `
      +`${RUNS.reduce((a,r)=>a+r.wells.length,0)} stored result(s), `
      +`${RUNS.reduce((a,r)=>a+uniqueCurveCount(r),0)} amplification curve(s).</div>`
      +(failed.length?`<div class="notice bad">${failed.map(esc).join("<br>")}</div>`:"")
    : `<div class="notice bad">Nothing could be read.<br>${failed.map(esc).join("<br>")}</div>`;
  CC_STATE.cache=null;CC_STATE.instrument="";CC_STATE.open=null;
  refreshAll();
  if(RUNS.length)showTab("results");
}
