  box.querySelectorAll(".ast-all").forEach(b=>b.onclick=()=>{
    selCatalogue().filter(x=>x.group===b.dataset.group&&x.ready()).forEach(x=>SEL_STATE.ids.add(x.id));astRender();});
  box.querySelectorAll(".ast-none").forEach(b=>b.onclick=()=>{
    selCatalogue().filter(x=>x.group===b.dataset.group).forEach(x=>SEL_STATE.ids.delete(x.id));astRender();});
  const runSel=astEl("ast-run");
  if(runSel){
    runSel.innerHTML=RUNS.map((r,i)=>`<option value="${i}"${i===selRunIndex()?" selected":""}>${esc(runName(r))}</option>`).join("")
      ||`<option value="0">no file read</option>`;
  }
  astEl("ast-lab").value=sopLabName();
  astEl("ast-analyst").value=sopAnalystName();
  astEl("ast-title").value=SEL_STATE.title;
  astCount();
}
function astCount(){
  const el=astEl("ast-count");if(!el)return;
  const s=selSelected();
  el.textContent=`${s.length} selected · ${s.filter(x=>x.kind==="image").length} figure(s) · ${s.filter(x=>x.kind==="data").length} table(s)`;
}
function astOutput(){
  const r=document.querySelector('#astm input[name="ast-out"]:checked');
  return r?r.value:"pdf";
}
async function astBuild(){
  const msg=astEl("ast-msg");
