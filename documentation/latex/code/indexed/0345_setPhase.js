function setPhase(next,reason){
  const prev=APP_STATE.phase;
  if(prev===next)return;
  const legal=APP_PHASE_TRANSITIONS[prev]||[];
  if(!legal.includes(next)){
    const note=`lifecycle transition ${prev} → ${next}${reason?` (${reason})`:``}`;
    if(typeof appNotice==="function")appNotice("lifecycle",note);else console.warn(note);
  }
  APP_STATE.phase=next;appStatusPaint();
}
