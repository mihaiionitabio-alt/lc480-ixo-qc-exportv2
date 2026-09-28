function wireSop(){
  const presetSel=$("#sop-preset");
  $("#sop-apply-preset").onclick=()=>{SOP=sopNormalise(SOP_PRESETS[presetSel.value]());sopProfileEdited(true);};
  $("#sop-open").onclick=()=>$("#sop-file").click();
  $("#sop-file").onchange=async e=>{const f=e.target.files[0];if(!f)return;
    try{const p=JSON.parse(await f.text());const claimed=p.sha256;SOP=sopNormalise(p);
      const h=sopHash();$("#sop-msg").innerHTML=claimed?(claimed===h?`<span class="tag ok">${esc(ui("Profile checksum verified"))}</span>`:`<span class="tag bad">${esc(ui("Profile checksum does not match — the file was edited after it was saved"))}</span>`):"";
      sopProfileEdited(true);}catch(err){$("#sop-msg").innerHTML=`<span class="err">${esc(err.message)}</span>`;}
    e.target.value="";};
  $("#sop-save").onclick=()=>download(safeName(SOP.name+"_v"+SOP.version)+".sop.json",sopJSON(),"application/json");
  $("#sop-lock").onchange=e=>{SOP.locked=e.target.checked;sopProfileEdited(true);};
  ["#sop-run","#sop-view","#sop-outcome"].forEach(id=>$(id).onchange=()=>{SOP_VIEW.page=0;renderSopResults();});
  $("#sop-search").oninput=()=>{SOP_VIEW.page=0;renderSopResults();};
  $("#sop-dl-csv").onclick=()=>{const rows=sopCurrentRows();if(rows.length)download(baseName()+"_SOP_"+$("#sop-view").value+".csv",csvOf(rows),"text/csv");};
  $("#sop-dl-xlsx").onclick=sopDownloadWorkbook;
  $("#sop-dl-zip").onclick=sopDownloadBundle;
}
