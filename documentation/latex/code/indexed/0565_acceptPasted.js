function acceptPasted(text,source){
  const r=parseCqTable(text,source);
  const msg=$("#csvmsg");
  if(r.error){msg.innerHTML=`<div class="notice bad">${esc(r.error)}</div>`;return;}
  PASTED=r;RUNS=[];
  msg.innerHTML=`<div class="notice ok">Read <b>${r.rows.length}</b> Cq value(s) from the
    “${esc(r.header)}” column, grouped by “${esc(r.sampleCol)}”.
    ${r.skipped.length?`${r.skipped.length} row(s) had no usable number and were left out.`:""}</div>`;
  refreshAll();
}
