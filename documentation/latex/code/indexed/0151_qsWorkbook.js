function qsWorkbook(run,opt){
  const T=EDS.qsTables(run.eds,opt),head=T.header.map(([k,v])=>[k,v]);
  if(opt&&opt.pseudo)head.push(["Sample Names","pseudonymised by the exporting page"]);
  return makeXlsx(T.sheets.map(s=>{
    const body=s.rows.map(r=>{const a=s.cols.map(c=>r[c]===undefined?null:r[c]);if(s.ragged)while(a.length>3&&a[a.length-1]==null)a.pop();return a;});
    return {name:s.name,rows:[...head,[],[],s.cols,...body,...(s.tail||[])]};
  }));
}
