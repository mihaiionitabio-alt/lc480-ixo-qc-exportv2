function mgViewPanel(){
  const insts=mgSafe(()=>ccInstruments(),[]);
  if(!insts.length)return [mgIt({kind:"chart",sev:"none",pict:MG_PICT.chart,kindWord:"control panel",code:"CC",
    title:"No instrument history yet",value:"0",unit:"runs",
    state:"Control charts are built from the numbers the instrument writes into its own files. Read a run, or import a stored history.",
    actions:[{key:"3",label:"Open the control panel on the page",cmd:"open page panel"}]})];
  const key=CC_STATE.instrument&&insts.some(i=>i.key===CC_STATE.instrument)?CC_STATE.instrument:insts[0].key;
  const rows=ccRowsFor(key),items=mgPanelItems(true);
  const c=t=>items.filter(x=>x.sev===t).length;
  const out=[mgIt({kind:"summary",sev:c("alarm")?"alarm":c("watch")?"watch":"ok",pict:MG_PICT.instrument,
    kindWord:"instrument",code:"CC",title:key,value:String(rows.length),unit:"runs in this history",
    limits:`${items.length} chart(s) · ${c("alarm")} outside limits · ${c("watch")} to watch`,
    state:c("alarm")?`${c("alarm")} chart(s) have a point outside a control or specification limit.`
      :c("watch")?`${c("watch")} chart(s) show a pattern inside the limits.`
      :"Every chart with limits is in control on the latest run.",
    evidence:`${insts.length} instrument(s) in the loaded history`,
    rows:[["Instrument",key],["Runs",String(rows.length)],["Charts",String(items.length)],
          ["Outside limits",String(c("alarm"))],["To watch",String(c("watch"))],
          ["In control",String(c("ok"))],["Collecting a baseline",String(c("none"))],
          ["Baseline needed",String(mgSafe(()=>ccBaselineNeed(ccCfg("heat_rate")),"—"))+" runs"]],
    actions:[{key:"3",label:"Open the control panel on the page",cmd:"open page panel"}]})];
  return out.concat(items);
}
