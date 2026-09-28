function baseName(){
  if(RUNS.length===1)return safeName(RUNS[0].meta.name||RUNS[0].file.replace(/\.(ixo|eds|edt)$/i,""));
  if(RUNS.length>1)return `${RUNS.length}_runs_${stamp()}`;
  return "cq_values";
}
