function renderValues(){
  const rows=allWellRows();
  /* The melting export is offered only when a Tm Calling analysis actually
     stored peaks. Offering a button that downloads an empty file is worse than
     not offering it, because it implies the data exists and the page lost it. */
  const tmBtn=$("#dl-tm");
  if(tmBtn)tmBtn.hidden=tmRows().length===0;
  if(!rows.length&&PASTED){
    $("#valsum").innerHTML=`<div class="notice">Showing pasted Cq values. Load an .ixo or .eds file for the full table.</div>`;
    $("#valtable").innerHTML=table([{key:"well",label:"Well"},{key:"sample",label:"Sample"},{key:"cq",label:"Cq",n:1}],
      PASTED.rows.map(r=>({well:r.well,sample:r.sample,cq:num(r.cq,3)})));
    return;
  }
  if(!rows.length){$("#valsum").innerHTML="";$("#valtable").innerHTML=`<div class="notice">Nothing loaded yet.</div>`;return;}
  const withCq=rows.filter(r=>r.cq!=="").length;
  const withConc=rows.filter(r=>r.concentration!=="").length;
  $("#valsum").innerHTML=`<div class="kv" style="margin-bottom:10px">
    <b>Rows</b><span>${rows.length}</span>
    <b>With a stored Cq</b><span>${withCq}</span>
    <b>With a stored concentration</b><span>${withConc}</span>
    <b>With a decoded curve</b><span>${rows.filter(r=>r.has_curve==="yes").length}</span>
    <b>Melting peaks</b><span>${tmRows().length}</span></div>`;
  const cols=[{key:"experiment",label:"Experiment"},{key:"well",label:"Well"},{key:"sample",label:"Sample"},
    {key:"target",label:"Target"},{key:"role",label:"Role"},{key:"cq",label:"Cq",n:1},
    {key:"concentration",label:"Concentration",n:1},{key:"call",label:"Call"},{key:"amp_status",label:"Amp status"},
    {key:"flags",label:"Flags"},{key:"delta_cq",label:"ΔCq",n:1},{key:"rq",label:"RQ",n:1},{key:"analysis",label:"Analysis"}];
  const show=rows.slice(0,600).map(r=>Object.assign({},r,{
    cq:r.cq===""?"":num(Number(r.cq),3),
    concentration:r.concentration===""?"":Number(r.concentration).toPrecision(5),
    delta_cq:r.delta_cq===""?"":num(Number(r.delta_cq),3),rq:r.rq===""?"":Number(r.rq).toPrecision(4)}));
  const rq=rqRows(),rqBtn=$("#dl-rq");if(rqBtn)rqBtn.hidden=!rq.length;
  $("#rqcard").style.display=rq.length?"":"none";
  if(rq.length)$("#rqtable").innerHTML=table([{key:"experiment",label:"Experiment"},{key:"sample",label:"Sample"},
    {key:"target",label:"Target"},{key:"reference",label:"Reference"},{key:"n",label:"n",n:1},
    {key:"target_cq_mean",label:"Target Cq",n:1},{key:"reference_cq_mean",label:"Reference Cq",n:1},
    {key:"delta_cq_mean",label:"ΔCq mean",n:1},{key:"delta_cq_se",label:"ΔCq SE",n:1},{key:"delta_delta_cq",label:"ΔΔCq",n:1},
    {key:"ratio",label:"RQ / ratio",n:1},{key:"ratio_min",label:"Min",n:1},{key:"ratio_max",label:"Max",n:1}],
    rq.map(x=>{const o=Object.assign({},x);["target_cq_mean","reference_cq_mean","delta_cq_mean","delta_cq_se","delta_delta_cq"].forEach(k=>o[k]=o[k]===""||o[k]==null?"":num(Number(o[k]),3));
      ["ratio","ratio_min","ratio_max"].forEach(k=>o[k]=o[k]===""||o[k]==null?"":Number(o[k]).toPrecision(4));return o;}));
  $("#valtable").innerHTML=table(cols,show)
    +(rows.length>600?`<div class="notice">Showing the first 600 of ${rows.length} rows. The CSV has all of them.</div>`:"");
}