function renderDerived(){
  const card=$("#derivedcard");if(!card)return;
  if(!RUNS.length){card.style.display="none";return;}
  setSelectItems($("#derived-run"),RUNS.map((r,i)=>({value:i,label:runName(r)})));
  const notes=derivedSettingsFor(RUNS[Number($("#derived-run").value)||0]);
  $("#dl-derived-all").onclick=()=>{const all=RUNS.flatMap(r=>derivedSettingsFor(r).map(n=>Object.assign({experiment:runName(r)},n)));
    download(baseName()+"_experiment_settings_all_runs.csv",toCSV([{key:"experiment",label:"experiment"},{key:"setting",label:"setting"},{key:"value",label:"value"},{key:"source",label:"read_from"}],all),"text/csv");};
  card.style.display="";
  $("#derived").innerHTML=table(
    [{key:"setting",label:"Setting"},{key:"value",label:"Value"},{key:"source",label:"Read from"}],notes);
  $("#dl-derived").onclick=()=>download(baseName()+"_experiment_settings.csv",
    toCSV([{key:"setting",label:"setting"},{key:"value",label:"value"},{key:"source",label:"read_from"}],notes),
    "text/csv");
}
