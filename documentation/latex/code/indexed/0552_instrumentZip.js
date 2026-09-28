function instrumentZip(){
  const run=runAt("#instrument-run",0);if(!run)return;
  const t=instrumentRecordTables(run),entries=Object.entries(t).map(([name,rows])=>({
    name:name+".csv",data:toCSV(Object.keys(rows[0]||{}).map(k=>({key:k,label:k})),rows)
  }));
  download(safeName(runName(run))+"_instrument_records.zip",makeStoredZip(entries),"application/zip");
}
