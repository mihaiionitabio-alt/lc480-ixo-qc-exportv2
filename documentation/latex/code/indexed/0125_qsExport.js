function qsExport(r,opt){
  const T=qsTables(r,opt),NL="\r\n",TAB="\t",cell=v=>v==null?"":String(v);
  let out=T.header.map(([k,v])=>`* ${k.trim()} = ${v??""}`).join(NL)+NL;
  if(opt&&opt.pseudo)out+="* Sample Names = pseudonymised by the exporting page"+NL;
  out+="* Exported By = qPCR QC and forensic export tool (layout of the QuantStudio export, rebuilt from the .eds; not produced by Thermo Fisher software)"+NL+NL;
  T.sheets.filter(s=>s.name!=="Reagent Information").forEach(s=>{
    out+=`[${s.name}]`+NL+s.cols.join(TAB)+NL;
    s.rows.forEach(row=>{out+=s.cols.map(c=>cell(row[c])).join(TAB).replace(/\t+$/,s.ragged?"":"$&")+NL;});
    (s.tail||[]).forEach(t=>{out+=t.join(TAB)+NL;});
    out+=NL;
  });
  return out;
}
