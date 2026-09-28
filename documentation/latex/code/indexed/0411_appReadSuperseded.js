function appReadSuperseded(msg){
  /* A read that is overtaken (new selection or Stop) must not leave half a data set behind. */
  const stopped=APP_STATE.cancelRequested;APP_STATE.cancelRequested=false;
  RUNS=[];PASTED=null;PSEUDO_MAP=null;
  ["load","sop","results","panel","graphs","review","export","integrity"].forEach(t=>markDirty(t));
  if(msg)msg.innerHTML=`<div class="notice warn">${esc(stopped?"The read was stopped. Nothing from it is loaded.":"The read was replaced by a newer selection. Nothing from it is loaded.")}</div>`;
  setPhase(STAGED.length?"staged":"idle","read superseded");
}
