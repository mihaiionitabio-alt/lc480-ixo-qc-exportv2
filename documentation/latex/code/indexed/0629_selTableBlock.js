  L.push("");
  L.push("figures/  one .svg per selected figure, with the numbers behind it as .csv");
  L.push("tables/   one .csv per selected table");
  L.push("selection.csv  the selection itself, so the same report can be rebuilt");
  L.push("");
  L.push("MISSY / RUO / NOT VALIDATED");
  L.push("missy_logo.svg  option 3; dna_separator.svg  vector separator");
  L.push("");
  L.push("Values are the values the instrument software stored. This archive is not a");
  L.push("validated report and does not replace the laboratory's own record.");
  return L.join("\n");
}
/* The pseudonym switch on the Open formats tab governs every export the page writes,
   and a report is an export. The asynchronous form is needed because a figure has to be
   rasterised before the next one is drawn. */
async function selWithExportNames(fn){
  if(!pseudoOn())return await fn();
  const keep=RUNS;RUNS=keep.map(pseudoRun);
  try{return await fn();}finally{RUNS=keep;}
}
function selDownloadZip(name){
  const entries=withExportNames(selZipEntries);
  download(safeName(name||((sopLabName()||baseName())+"_selection"))+".zip",makeStoredZip(entries),"application/zip");
  return entries.length;
}

/* ---------- 6 . the report ----------
   A cover that says who produced it and against which profile, then one
   section per selected item. A figure is drawn at the width of the text
   block; a table is printed one row to a line and truncated at the column
   width, with the number of rows left out stated underneath. */
const SEL_TABLE_ROWS=28;
function selReportTitle(){
  return SEL_STATE.title||("Selected results" + (RUNS.length===1?" — "+runName(RUNS[0]):""));
}
function selTableBlock(doc,rows,note){
  if(!rows||!rows.length){doc.para("No rows.",9.5,false);return;}
  const cols=uniq(rows.flatMap(Object.keys)).slice(0,8);
  const shown=rows.slice(0,SEL_TABLE_ROWS);
  const size=8.5,gap=6;
  const wid=cols.map(c=>{
    let w=pdfWidth(c,size,true);
    shown.forEach(r=>{w=Math.max(w,pdfWidth(String(r[c]==null?"":r[c]),size,false));});
    return w;
  });
  /* Water-filling: a column never takes more than it needs, and a column that needs
