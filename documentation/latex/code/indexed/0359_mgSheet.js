function mgSheet(kind){
  const it=mgItem(),box=document.getElementById("mg-sheet");
  if(!it||!it.chartId)return;
  const opts=kind==="type"?mgChartTypeOptions(it):mgChartAxisOptions(it);
  if(opts.length<2)return;
  MG.sheet={kind,opts};
  document.getElementById("mg-sheet-title").textContent=kind==="type"?"Chart type":"X axis";
  document.getElementById("mg-sheet-list").innerHTML=opts.map((o,i)=>
    `<button data-i="${i}" class="${o.current?"current":""}">
       <span class="k">${i+1} · select${o.current?" · in use":""}</span>
       <span class="l">${esc(o.label)}</span></button>`).join("");
  document.querySelectorAll("#mg-sheet-list button").forEach(b=>b.onclick=()=>mgSheetPick(+b.dataset.i));
  box.hidden=false;
  const first=document.querySelector("#mg-sheet-list button");if(first)first.focus();
}
