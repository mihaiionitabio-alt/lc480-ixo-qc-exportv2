async function readStaged(){
  /* One entry point, one exit state: whatever happens inside, the phase is defined again
     when this returns and any fault is recorded once. */
  const task=appTaskStart("Reading experiment files",STAGED.length,true);
  try{return await readStagedCore(task);}
  catch(e){appError("read",e);const m=$("#readmsg");
    if(m)m.innerHTML=`<div class="notice bad">The read stopped: ${esc(e.message||String(e))}</div>`;}
  finally{appTaskEnd(task);
    if(APP_STATE.phase==="reading")setPhase(RUNS.length?"ready":"idle","read finished");
    appStatusPaint();}
}
