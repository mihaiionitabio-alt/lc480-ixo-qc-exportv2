function controlBatchGraph(c,mode){
  const selected=SOP.controls[Number(c.control)],all=controlBatchRecords();
  /* Control records are rebuilt during evaluation, so object identity is not
     stable after a profile import or edit. Match by the persisted id/name. */
  const selectedId=selected&&(selected.id||selected.name||selected.match);
  const rs=all.filter(r=>(!c.target||r.target===c.target)&&(!selected||r.controlId===selectedId||r.control===selected.name||r.control===selected.match));
  const xval=r=>mode==="age"?r.age_days:mode==="thermal"?r.cooling:r.date/864e5;
  const rows=rs.filter(r=>Number.isFinite(xval(r))&&Number.isFinite(r.cq));
  if(!rows.length)return {svg:svgMessage("No eligible controls: configure positive-control names, target and valid extraction dates."),rows:[]};
  const cm=new Map(),groups=byKey(rows,r=>`${r.instrument} | ${r.target} | ${r.batch} | ${r.protocol}`);
  const series=[...groups].map(([k,v])=>({type:"points",r:4,colour:catColour(cm,k),data:v.map(r=>[xval(r),r.cq,`${r.experiment} · ${r.raw_name} · ${r.target} · ${r.detected}/${r.replicates} detected · ${r.date_state}`])}));
  const x=extent(rows.map(xval));
  const xticks=mode==="batch"?niceTicks(x[0],x[1],6).map(v=>({v,label:new Date(v*864e5).toISOString().slice(0,10)})):undefined;
  return {svg:svgPlot({title:`Control ${mode==="age"?"extract age":mode==="thermal"?"cooling association":"batches over time"} — descriptive, ${rows.length}/${rs.length} eligible groups`,
    width:1100,right:340,height:480,legendChars:52,x,y:extent(rows.map(r=>r.cq)),xticks,xlab:mode==="age"?"Days since labelled extraction":mode==="thermal"?"Peak cooling rate (°C/s), compare only the same instrument/program":"Run date",
    ylab:"Mean control Cq",series,legend:legendFromMap(cm).map(x=>({...x,label:x.label.split(" | ").slice(0,3).join(" | ")}))}),rows:rs.map(({setting,...r})=>r)};
}
