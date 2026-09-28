function wirePanel(){
  ccRestore();$("#cc-remember").checked=CC_STATE.remember;
  $("#cc-inst").onchange=e=>{CC_STATE.instrument=e.target.value;CC_STATE.protocol="";CC_STATE.open=null;$("#cc-detail").hidden=true;renderPanel();};
  $("#cc-filter").onchange=renderPanel;
  $("#cc-proto").onchange=e=>{CC_STATE.protocol=e.target.value;renderPanel();};
  $("#cc-import").onclick=()=>$("#cc-file").click();
  $("#cc-file").onchange=async e=>{const f=e.target.files[0];if(!f)return;
    try{const n=ccImport(await f.text());$("#cc-msg").innerHTML=`<span class="tag ok">${n} ${esc(ui("history rows read"))}</span>`;renderPanel();}
    catch(err){appError("history import",err);$("#cc-msg").innerHTML=`<span class="err">${esc(err.message)}</span>`;}e.target.value="";};
  $("#cc-export").onclick=()=>download(safeName(CC_STATE.instrument||"instrument")+"_history.json",ccHistoryJSON(true),"application/json");
  $("#cc-export-csv").onclick=()=>download(safeName(CC_STATE.instrument||"instrument")+"_history.csv",ccHistoryCSV(),"text/csv");
  $("#cc-zip").onclick=async()=>{const b=$("#cc-zip"),msg=$("#cc-msg");if(!ccAllRows().length)return;b.disabled=true;
    try{const n=await ccZipAll($("#cc-zip-png").checked,(d,t)=>{msg.innerHTML=`<div class="notice">${esc(ui("Preparing the charts"))}: ${d} / ${t}</div>`;});
      msg.innerHTML=`<div class="notice ok">${esc(ui("ZIP ready"))}: ${n} ${esc(ui("files"))}.</div>`;}
    catch(e){appError("control-chart archive",e);msg.innerHTML=`<div class="notice bad">${esc(e.message)}</div>`;}finally{b.disabled=false;}};
  $("#cc-remember").onchange=e=>{CC_STATE.remember=e.target.checked;if(e.target.checked)ccRemember();else try{localStorage.removeItem(CC_HIST_KEY);}catch(x){}};
  document.querySelectorAll("[data-goto-graph]").forEach(b=>b.onclick=()=>{showTab("graphs");$("#g-graph").value=b.dataset.gotoGraph;renderGraphs();});
}
