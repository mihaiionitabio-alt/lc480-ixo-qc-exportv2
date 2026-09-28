function renderReviewPlate(){
  const box=$("#review-plate"),runSel=$("#plate-run"),targetSel=$("#plate-target");if(!box)return;
  if(!RUNS.length){
    setSelectItems(runSel,[],null);setSelectItems(targetSel,[],null);box.innerHTML=emptyReview();return;
  }
  const oldRun=runSel.value;
  setSelectItems(runSel,RUNS.map((r,i)=>({value:i,label:runName(r)})),oldRun);
  const run=runAt("#plate-run",0),oldTarget=targetSel.value;
  setSelectItems(targetSel,analysisChoices(run),oldTarget);
  const rows=plateMapRows(run,targetSel.value),mode=$("#plate-colour").value,
    cq=rows.map(r=>Number(r.cq)).filter(Number.isFinite),lo=cq.length?Math.min(...cq):0,hi=cq.length?Math.max(...cq):1;
  let h=`<div class="plate-scroll"><div class="plate-grid" style="grid-template-columns:24px repeat(${run.cols},96px)">`;
  h+=`<div class="plate-corner"></div>`;
  for(let c=1;c<=run.cols;c++)h+=`<div class="plate-head">${c}</div>`;
  for(let r=0;r<run.rows;r++){
    h+=`<div class="plate-rowhead">${String.fromCharCode(65+r)}</div>`;
    for(let c=0;c<run.cols;c++){
      const x=rows[r*run.cols+c],bg=plateColour(x,mode,lo,hi),empty=!x.sample&&!x.results;
      const sub=x.cq!==""?`Cq ${num(Number(x.cq),2)}`:(x.call||x.role||x.subsets||"");
      const tip=[x.well,x.sample,x.target,x.analysis,x.role,x.instrument_type,
        x.cq!==""?`Cq ${x.cq}`:"",x.call,x.named_unanalysed?"named but not analysed":""].filter(Boolean).join("\n");
      h+=`<div class="plate-well ${empty?"empty":""}" data-plate-pos="${x.position-1}"
        style="background:${bg}" title="${esc(tip)}"><strong>${esc(x.sample||x.well)}</strong>
        <span>${esc(sub)}</span>${x.named_unanalysed?`<span>not analysed</span>`:""}</div>`;
    }
  }
  h+=`</div></div>`;
  const legends=new Map();
  rows.forEach(r=>{
    const key=mode==="subset"?r.subsets:mode==="type"?r.instrument_type:mode==="call"?r.call:mode==="cq"?"Cq scale":r.role;
    if(key&&!legends.has(key))legends.set(key,plateColour(r,mode,lo,hi));
  });
  h+=`<div class="plate-legend">${[...legends].slice(0,18).map(([k,v])=>
    `<span><i style="background:${v}"></i>${esc(k)}</span>`).join("")}</div>
    <p class="hint">${rows.filter(r=>r.named_unanalysed==="yes").length} named position(s) have no result in the selected analysis.</p>`;
  box.innerHTML=h;
}
