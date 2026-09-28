function mgViewIntegrity(){
  const rows=mgSafe(()=>integrityMismatches(),[]);
  if(!rows.length)return [mgIt({kind:"integrity",sev:"ok",pict:MG_PICT.file,kindWord:"file integrity",code:"INT",
    title:"No file-integrity mismatch",value:"0",unit:"mismatches",limits:`${RUNS.length} file(s) examined`,
    state:RUNS.length?"Every loaded file passed its available integrity comparisons.":"Load experiment files to check them.",
    actions:[{key:"3",label:"Open File integrity on the page",cmd:"open page integrity"}]})];
  return [mgIt({kind:"summary",sev:"alarm",pict:MG_PICT.file,kindWord:"file integrity",code:"INT",
    title:"File-integrity mismatches",value:String(rows.length),unit:rows.length===1?"mismatch":"mismatches",
    limits:`${RUNS.length} file(s) examined`,state:"Each mismatch is listed below. Stored values are unchanged.",
    rows:rows.slice(0,14).map((r,i)=>[`${i+1}. ${r.file}`,`${r.type}: ${r.actual}`]),
    actions:[{key:"3",label:"Open File integrity on the page",cmd:"open page integrity"}]})].concat(rows.map((r,i)=>mgIt({kind:"integrity",sev:"alarm",pict:MG_PICT.file,kindWord:"file integrity",code:"I"+(i+1),title:r.file,value:r.type,unit:"mismatch",limits:`expected ${r.expected}`,
    state:r.detail,evidence:`observed ${r.actual}`,rows:[["File",r.file],["Check",r.type],["Expected",r.expected],["Observed",r.actual]],actions:[{key:"3",label:"Open File integrity on the page",cmd:"open page integrity"}]})));
}
