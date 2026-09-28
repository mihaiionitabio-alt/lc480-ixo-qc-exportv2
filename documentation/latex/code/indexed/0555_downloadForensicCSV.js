function downloadForensicCSV(){
  const events=reviewForensicEvents(),runs=reviewRunRows(events),rows=[
    ...runs.map(r=>({record_type:"run",...r})),
    ...events.map(e=>({record_type:"forensic_event",experiment:e.experiment,severity:e.severity,
      area:e.area,finding:e.finding,evidence:e.evidence}))
  ],keys=uniq(rows.flatMap(Object.keys));
  download(baseName()+"_runs_qc_forensic_log.csv",toCSV(keys.map(k=>({key:k,label:k})),rows),"text/csv");
}
