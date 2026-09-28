function renderSopResults(){
  const box=$("#sop-results");if(!box)return;
  if(!RUNS.length){box.innerHTML=emptyReview();$("#sop-metrics").innerHTML="";return;}
  const all=sopEvaluateAll();
  const runSel=$("#sop-run");setSelectItems(runSel,[{value:"",label:"All runs"},...RUNS.map((r,i)=>({value:i,label:runName(r)}))]);
  const nAcc=all.filter(e=>e.status==="Accepted").length,nRev=all.filter(e=>e.status==="Accepted with review").length,nRej=all.filter(e=>e.status==="Rejected").length,
    nNA=all.filter(e=>/^Profile not applicable/.test(e.status)).length;
  const act=all.reduce((n,e)=>n+e.rows.filter(r=>/Invalid|Repeat|Inconclusive|Control fail/.test(r.outcome)).length,0);
  $("#sop-metrics").innerHTML=`<div class="metric-grid">${metricCard(nAcc,"runs accepted","ok")}${metricCard(nRev,"runs accepted with review",nRev?"warn":"ok")}
    ${metricCard(nRej,"runs rejected",nRej?"bad":"ok")}${metricCard(nNA,"profile not applicable",nNA?"warn":"ok")}${metricCard(act,"results needing action",act?"warn":"ok")}</div>`;
  const view=$("#sop-view").value,ri=runSel.value,filt=$("#sop-outcome").value,q=($("#sop-search").value||"").toLowerCase();
  let rows,cols;
  if(view==="runs"){
    rows=sopRunRows().filter(r=>ri===""||r.experiment===runName(RUNS[ri]));
    cols=[{key:"experiment",label:"Experiment"},{key:"status",label:"Status",html:1},{key:"rejected",label:"Rejected by"},{key:"review",label:"Review"},
      {key:"positive",label:"Positive",n:1},{key:"negative",label:"Negative",n:1},{key:"inconclusive",label:"Inconclusive",n:1},{key:"repeat",label:"Repeat",n:1},
      {key:"invalid",label:"Invalid",n:1},{key:"control_fail",label:"Control fail",n:1},{key:"run_start",label:"Run started"},{key:"last_change",label:"Last change"},
      {key:"hours_run_end_to_last_change",label:"Hours to last change",n:1}];
    rows=rows.map(r=>Object.assign({},r,{status:tag(r.status==="Rejected"?"bad":r.status==="Accepted"?"ok":"warn",r.status)}));
  }else if(view==="criteria"){
    rows=sopCriteriaRows().filter(r=>ri===""||r.experiment===runName(RUNS[ri]));
    if(filt)rows=rows.filter(r=>filt==="attention"?r.status==="fail"||r.status==="review":true);
    cols=[{key:"experiment",label:"Experiment"},{key:"criterion",label:"Criterion"},{key:"status",label:"Result",html:1},{key:"sop_action",label:"SOP action"},{key:"evidence",label:"Evidence"}];
    rows=rows.map(r=>Object.assign({},r,{status:tag(r.status==="fail"?"bad":r.status==="review"?"warn":"ok",r.status),sop_action:SOP_ACTION_LABEL[r.sop_action]||r.sop_action}));
  }else if(view==="samples"){
    rows=sopSampleRows(ri);
    if(filt==="attention")rows=rows.filter(r=>r.needs_action||/Invalid run/.test(r.summary));
    cols=[{key:"experiment",label:"Experiment"},{key:"sample",label:"Sample"},{key:"summary",label:"Interpretation"},{key:"report",label:"Report text"}];
  }else{
    rows=sopInterpretationRows(ri);
    if(filt==="attention")rows=rows.filter(r=>/Invalid|Repeat|Inconclusive|Control fail/.test(r.outcome));
    else if(filt)rows=rows.filter(r=>r.outcome===filt);
    cols=[{key:"experiment",label:"Experiment"},{key:"sample",label:"Sample"},{key:"target",label:"Target"},{key:"kind",label:"Rule"},
      {key:"wells",label:"Wells"},{key:"detected",label:"Detected",n:1},{key:"replicates",label:"n",n:1},{key:"cq_mean",label:"Mean Cq",n:1},
      {key:"cq_sd",label:"SD",n:1},{key:"outcome",label:"Outcome",html:1},{key:"reason",label:"Reason"},{key:"stored_calls",label:"Stored call"}];
    rows=rows.map(r=>{const o=SOP.outcomes[r.outcome]||{};return Object.assign({},r,{cq_mean:r.cq_mean===""?"":num(r.cq_mean,2),cq_sd:r.cq_sd===""?"":num(r.cq_sd,2),
      outcome:`<span class="sop-pill" style="background:${esc(o.colour||"#94a3b8")}">${esc(r.label)}</span>`});});
  }
  if(q)rows=rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
  const per=200,pages=Math.max(1,Math.ceil(rows.length/per));SOP_VIEW.page=Math.min(SOP_VIEW.page,pages-1);
  const show=rows.slice(SOP_VIEW.page*per,(SOP_VIEW.page+1)*per);
  box.innerHTML=`<div class="scroll">${table(cols,show)}</div>
    <div class="toolbar" style="justify-content:space-between"><span class="hint">${rows.length} row(s)${pages>1?` · page ${SOP_VIEW.page+1} of ${pages}`:""}</span>
    ${pages>1?`<span><button class="ghost" id="sop-prev" type="button"${SOP_VIEW.page?"":" disabled"}>‹ Previous</button> <button class="ghost" id="sop-next" type="button"${SOP_VIEW.page<pages-1?"":" disabled"}>Next ›</button></span>`:""}</div>`;
  const pv=$("#sop-prev"),nx=$("#sop-next");
  if(pv)pv.onclick=()=>{SOP_VIEW.page--;renderSopResults();};
  if(nx)nx.onclick=()=>{SOP_VIEW.page++;renderSopResults();};
}
