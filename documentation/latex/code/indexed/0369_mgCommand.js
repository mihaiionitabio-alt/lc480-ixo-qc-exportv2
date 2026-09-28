function mgCommand(text,source){
  const t=String(text||"").toLowerCase().trim();
  if(MG.sheet){                                   /* while a sheet is open, a number or its name picks */
    const t0=t;
    if(/^[1-9]$/.test(t0)){mgSheetPick(+t0-1);return true;}
    const i=MG.sheet.opts.findIndex(o=>o.label.toLowerCase()===t0||o.value===t0);
    if(i>=0){mgSheetPick(i);return true;}
    if(/^(close|cancel|back|dismiss)$/.test(t0)){mgSheetClose();return true;}
  }
  const hit=MG_COMMANDS.find(c=>c.re.test(t));
  if(!hit)return false;
  /* Handlers read capture groups, so they are given the match, not the text.
     Passing the text made m[1] the second CHARACTER of the command. */
  const m=hit.re.exec(t)||[t];
  try{hit.act(m,t);}catch(e){appError("console:button",e);}
  mgRender();
  return true;
}
