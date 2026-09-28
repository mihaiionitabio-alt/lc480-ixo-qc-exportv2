const GRAPHS=[
 {id:"timeline",group:"Run history",title:"Run timeline — created, run, analysis, last change",scope:"run",
  note:"Every dated event the file carries: experiment creation, run start and end, analysis creation and edits, the last recorded change (for .eds, the newest ZIP entry date is the last save), instrument log and calibrations. Events more than 7 days from the run are listed in the table and marked at the edge.",
  render(c){
    const ev=runTimeline(c.run);if(!ev.length)return {svg:svgMessage("The file carries no dated events."),rows:[]};
    const T=runTimes(c.run),ref=Number.isFinite(T.start)?T.start:ev[0].time,near=ev.filter(e=>Math.abs(e.time-ref)<7*864e5);
    const lo=Math.min(...near.map(e=>e.time)),hi=Math.max(...near.map(e=>e.time)),span=(hi-lo)||3600000;
    const toH=t=>(Math.max(lo,Math.min(hi,t))-ref)/3600000;
    const cols={file:"#2563eb",run:"#16a34a",analysis:"#7c3aed",edit:"#dc2626",calibration:"#d97706"};
    const series=ev.map((e,i)=>({type:"points",r:5,colour:cols[e.kind],data:[[toH(e.time),ev.length-i,`${e.what}: ${sopFmtTime(e.time)}`,cols[e.kind]]]}));
    if(Number.isFinite(T.start)&&Number.isFinite(T.end))series.unshift({type:"bar",colour:"#bbf7d0",barWidth:0,data:[]});
    const height=Math.max(260,ev.length*20+90);
    const texts=ev.map((e,i)=>{const off=e.time<lo||e.time>hi;return {x:toH(e.time),y:ev.length-i,text:`  ${e.what}${off?` (${sopFmtTime(e.time)})`:""}`,colour:off?"#9ca3af":"#374151",anchor:toH(e.time)>((hi-ref)/3600000+(lo-ref)/3600000)/2?"end":"start"};});
    const svg=svgPlot({title:runName(c.run),height,x:[(lo-ref)/3600000-span/3600000*0.05,(hi-ref)/3600000+span/3600000*0.05],y:[0,ev.length+1],
      xlab:`Hours from run start (${sopFmtTime(ref)})`,ylab:"",series,texts,
      bands:Number.isFinite(T.start)&&Number.isFinite(T.end)?[{x0:0,x1:(T.end-ref)/3600000,colour:"#16a34a",opacity:0.1}]:[],
      legend:Object.entries(cols).map(([k,v])=>({label:{file:"file",run:"run",analysis:"analysis",edit:"change / save",calibration:"calibration"}[k],colour:v}))});
    return {svg,rows:ev.map(e=>({event:e.what,time:sopFmtTime(e.time),hours_from_run_start:+((e.time-ref)/3600000).toFixed(3),kind:e.kind,read_from:e.source}))};
  }},
 {id:"curves",group:"Fluorescence",title:"Amplification curves coloured by SOP outcome",scope:"run",opts:["target","signal"],
  note:"Stored curves of the selected target. Colour = outcome under the active SOP; dashed vertical lines = SOP Cq cut-off and late-signal limit; horizontal line = stored threshold (QuantStudio ΔRn).",
  render(c){
    const ws=gRunWells(c.run,c.target).filter(w=>c.signal==="drn"?(w.eds&&w.eds.drn&&w.eds.drn.length):(w.curve&&w.curve.length));
    if(!ws.length)return {svg:svgMessage("No curves for this selection."),rows:[]};
    const seen=new Set(),rows=[],used=new Map();
    const series=ws.filter(w=>{const k=`${w.pos}|${w.channel}|${w.target}`;if(seen.has(k))return false;seen.add(k);return true;}).map(w=>{
      const r=sopOutcomeFor(c.run,w),o=r?r.outcome:"Not interpreted",col=sopColour(o);used.set(sopLabel(o),col);
      const cur=c.signal==="drn"?w.eds.drn:w.curve;
      cur.forEach((v,i)=>rows.push({well:w.well,sample:w.sample,target:w.target,outcome:o,cycle:i+1,fluorescence:v}));
      return {type:"line",colour:col,data:cur.map((v,i)=>[i+1,c.log?Math.max(v,1e-6):v]),tip:`${w.well} ${w.sample} · ${w.target} · Cq ${num(sopCq(w),2)} · ${sopLabel(o)}`,
        width:o==="Negative"||o==="Not interpreted"?1:1.6};});
    series.sort((a,b)=>(a.width-b.width));
    const all=series.flatMap(s=>s.data.map(p=>p[1])),n=Math.max(...series.map(s=>s.data.length));
    const thr=c.signal==="drn"?uniq(ws.map(w=>w.eds&&w.eds.threshold).filter(Number.isFinite)):[];
    return {svg:svgPlot({title:`${runName(c.run)} — ${c.target||"all targets"}`,x:[1,n],y:c.log?[Math.max(1e-4,Math.min(...all.filter(v=>v>0))),Math.max(...all)*1.2]:extent(all),ylog:c.log,
      xlab:"Cycle",ylab:c.signal==="drn"?"ΔRn (stored)":"Fluorescence (stored)",series,vlines:gCutLines(c.target,"x"),
      hlines:thr.map(t=>({y:t,label:"stored threshold",colour:"#2563eb"})),legend:legendFromMap(used)}),rows};
  }},
 {id:"plate",group:"Plate",title:"Plate heat map",scope:"run",opts:["target","metric"],
  note:"Every physical position. Choose what the colour shows: SOP outcome, stored Cq, end fluorescence, background, amplitude, or analysis status (which also shows wells with signal that are in no analysis, and omitted wells).",
  render(c){
    const run=c.run,R=run.rows||8,C=run.cols||12,cell=Math.max(26,Math.min(64,Math.floor(760/C))),W=60+C*cell+190,H=46+R*cell+20;
    const tch=c.target?new Set((run.wells||[]).filter(w=>(w.target||w.analysis)===c.target).map(w=>w.channel)):null;
    const orph=orphanCurveCandidates(run).filter(o=>!tch||tch.has(o.channel));
    const orphPos=new Set(orph.map(o=>o.pos));
    const rows=[],vals=[];
    for(let pos=0;pos<R*C;pos++){
      const rec=(run.plate||{})[pos]||{},ws=(run.wells||[]).filter(w=>w.pos===pos&&(!c.target||(w.target||w.analysis)===c.target));
      const w=ws[0],sig=wellSignal(w?w.curve:(orph.find(o=>o.pos===pos)||{}).curve);
      const res=w?sopOutcomeFor(run,w):null;
      const other=!ws.length&&c.target&&(run.wells||[]).some(x=>x.pos===pos);
      const status=ws.length?(ws.every(sopOmitted)?"Omitted":"In analysis"):orphPos.has(pos)?"Signal, not analysed":other?"Other target only":rec.name?"Named, no result":"Empty";
      const row={well:posToWell(pos,C),sample:rec.name||(w&&w.sample)||"",target:uniq(ws.map(x=>x.target)).join(" | "),
        cq:w&&Number.isFinite(sopCq(w))?+sopCq(w).toFixed(3):"",outcome:res?res.outcome:"",status,
        end_fluorescence:Number.isFinite(sig.end)?+sig.end.toPrecision(6):"",background:Number.isFinite(sig.background)?+sig.background.toPrecision(6):"",
        amplitude:Number.isFinite(sig.amplitude)?+sig.amplitude.toPrecision(6):"",flags:ws.map(x=>x.warnCodes).filter(Boolean).join(" ")};
      rows.push(row);
      const m=c.metric;if(m==="cq"||m==="end_fluorescence"||m==="background"||m==="amplitude")vals.push(Number(row[m]===""?NaN:row[m]));
    }
    const [lo,hi]=extent(vals,0);
    const statusCol={"Other target only":"#f1f5f9","In analysis":"#bfdbfe","Omitted":"#fecaca","Signal, not analysed":"#f59e0b","Named, no result":"#e5e7eb","Empty":"#ffffff"};
    const used=new Map();
    let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="system-ui,Arial" font-size="10"><rect width="${W}" height="${H}" fill="#fff"/>
      <text x="10" y="16" font-size="13" font-weight="600">${svgEsc(runName(run))} — ${svgEsc(GRAPH_METRICS[c.metric]||c.metric)}${c.target?" · "+svgEsc(c.target):""}</text>`;
    for(let j=0;j<C;j++)s+=`<text x="${40+j*cell+cell/2}" y="38" text-anchor="middle" fill="#6b7280">${j+1}</text>`;
    rows.forEach((r,pos)=>{
      const i=Math.floor(pos/C),j=pos%C,x=40+j*cell,y=44+i*cell;
      if(j===0)s+=`<text x="28" y="${y+cell/2+3}" text-anchor="middle" fill="#6b7280">${String.fromCharCode(65+i)}</text>`;
      let fill="#fff",lab="";
      if(c.metric==="outcome"){fill=r.outcome?sopColour(r.outcome):statusCol[r.status]||"#fff";if(r.outcome)used.set(sopLabel(r.outcome),fill);else if(r.status!=="Empty")used.set(r.status,fill);lab=r.cq===""?"":num(r.cq,1);}
      else if(c.metric==="status"){fill=statusCol[r.status];used.set(r.status,fill);lab=r.cq===""?"":num(r.cq,1);}
      else{const v=Number(r[c.metric]);fill=r[c.metric]===""?"#f8fafc":heatColour(v,lo,hi);lab=r[c.metric]===""?"":fmtTick(+v.toPrecision(3));}
      const dark=/^#(1|0|9f|e11|dc|7c|64)/.test(fill);
      s+=`<rect x="${x+1}" y="${y+1}" width="${cell-2}" height="${cell-2}" rx="4" fill="${fill}" stroke="${r.status==="Signal, not analysed"?"#b45309":"#cbd5e1"}" stroke-width="${r.status==="Signal, not analysed"?2:1}"><title>${svgEsc(`${r.well} ${r.sample}\n${r.target}\nCq ${r.cq}\n${r.outcome||r.status}`)}</title></rect>`;
      if(cell>=34)s+=`<text x="${x+cell/2}" y="${y+cell/2+3}" text-anchor="middle" fill="${dark?"#fff":"#111827"}">${svgEsc(lab)}</text>`;
    });
    let ly=46;const lx=40+C*cell+16;
    if(c.metric==="outcome"||c.metric==="status")used.forEach((col,l)=>{s+=`<rect x="${lx}" y="${ly}" width="12" height="12" rx="2" fill="${col}" stroke="#cbd5e1"/><text x="${lx+18}" y="${ly+10}" fill="#374151" font-size="11">${svgEsc(l)}</text>`;ly+=18;});
    else{for(let k=0;k<=5;k++){const v=lo+(hi-lo)*k/5;s+=`<rect x="${lx}" y="${ly}" width="12" height="12" fill="${heatColour(v,lo,hi)}" stroke="#cbd5e1"/><text x="${lx+18}" y="${ly+10}" font-size="11">${fmtTick(+v.toPrecision(3))}</text>`;ly+=18;}}
    return {svg:s+"</svg>",rows};
  }},
 {id:"unanalysed",group:"Plate",title:"Signal in wells that are not in any analysis",scope:"run",
  note:"Rising fluorescence in positions that carry no result (unnamed wells, wells left out of every analysis, or wells without a target). These are the places where a sample may have been run but not reported.",
  render(c){
    const orph=orphanCurveCandidates(c.run);
    if(!orph.length)return {svg:svgMessage("No rising curve outside the analyses in this run."),rows:[]};
    const cm=new Map(),rows=[];
    const series=orph.map(o=>{const col=catColour(cm,`${o.well}${o.filterComb?" · "+o.filterComb:""}`);
      o.curve.forEach((v,i)=>rows.push({well:o.well,sample:o.sample,channel:o.filterComb||o.filterName||o.channel,cycle:i+1,fluorescence:v,finding:o.finding}));
      return {type:"line",colour:col,data:o.curve.map((v,i)=>[i+1,v]),tip:`${o.well} ${o.sample||""} · ${o.finding}`};});
    const all=series.flatMap(s=>s.data.map(p=>p[1]));
    return {svg:svgPlot({title:`${runName(c.run)} — ${orph.length} curve(s) outside the analyses`,x:[1,Math.max(...series.map(s=>s.data.length))],y:extent(all),
      xlab:"Cycle",ylab:"Fluorescence (stored)",series,legend:legendFromMap(cm)}),rows};
  }},
 {id:"cqstrip",group:"Results",title:"Cq by target with SOP cut-offs",scope:"run",opts:["colourby"],
  note:"One point per well. Colour by SOP outcome or by role. Red dashed line: Cq cut-off; orange: late-signal limit (per target).",
  render(c){
    const ts=gTargets(c.run);if(!ts.length)return {svg:svgMessage("No results."),rows:[]};
    const cm=new Map(),rows=[],series=[],hl=[];
    ts.forEach((t,ti)=>{
      gRunWells(c.run,t).forEach((w,k)=>{const q=sopCq(w);if(!Number.isFinite(q))return;
        const r=sopOutcomeFor(c.run,w),key=c.colourby==="role"?(w.role||"Unknown"):sopLabel(r?r.outcome:"Not interpreted");
        const col=c.colourby==="role"?catColour(cm,key):(cm.set(key,sopColour(r?r.outcome:"Not interpreted")),sopColour(r?r.outcome:"Not interpreted"));
        const jit=((k*37)%21-10)/40;
        series.push({type:"points",data:[[ti+jit,q,`${w.well} ${w.sample} · ${t} · Cq ${num(q,2)} · ${key}`,col]]});
        rows.push({target:t,well:w.well,sample:w.sample,role:w.role,cq:q,outcome:r?r.outcome:""});});
      gCutLines(t,"y").forEach(l=>series.push({type:"line",colour:l.colour,dash:"5 4",width:1.2,data:[[ti-0.4,l.y],[ti+0.4,l.y]],tip:l.label}));
    });
    const qs=rows.map(r=>r.cq).concat(ts.flatMap(t=>gCutLines(t,"y").map(l=>l.y)));
    return {svg:svgPlot({title:runName(c.run),x:[-0.6,ts.length-0.4],y:extent(qs),xticks:ts.map((t,i)=>({v:i,label:t.slice(0,18)})),
      xlab:"Target",ylab:"Stored Cq",series,legend:legendFromMap(cm)}),rows};
  }},
 {id:"repsd",group:"Results",title:"Replicate spread — mean Cq against SD",scope:"run",
  note:"One point per sample and target with two or more detected replicates. The dashed line is the SOP maximum SD.",
  render(c){
    const ev=sopEvaluateAll()[c.ri];const pts=ev.rows.filter(r=>r.det>=2&&Number.isFinite(r.cqSd));
    if(!pts.length)return {svg:svgMessage("No replicate groups with two or more detected wells."),rows:[]};
    const cm=new Map();const series=[{type:"points",data:pts.map(r=>[r.cqMean,r.cqSd,`${r.sample} · ${r.target} · SD ${num(r.cqSd,3)} · ${r.label}`,(cm.set(r.label,r.colour),r.colour)])}];
    return {svg:svgPlot({title:runName(c.run),x:extent(pts.map(r=>r.cqMean)),y:[0,Math.max(sopNum(SOP.replicates.maxSd)*1.3||0,...pts.map(r=>r.cqSd))*1.1],
      xlab:"Mean Cq",ylab:"SD of Cq",series,legend:legendFromMap(cm),
      hlines:SOP.graphs.showSdLimit?[{y:sopNum(SOP.replicates.maxSd),label:`SOP max SD ${SOP.replicates.maxSd}`,colour:"#b91c1c"}]:[]}),
      rows:pts.map(r=>({sample:r.sample,target:r.target,n:r.n,detected:r.det,cq_mean:r.cqMean,cq_sd:r.cqSd,outcome:r.outcome}))};
  }},
 {id:"stdcurve",group:"Results",title:"Standard curve with residuals and SOP limits",scope:"run",opts:["target"],
  note:"Cq against log10 of the stored standard quantity, fitted by least squares on this page. The label shows slope, R², efficiency and range against the SOP limits; residuals are in the table.",
  render(c){
    const scs=sopStdCurves(c.run).filter(s=>!c.target||s.target===c.target);
    if(!scs.length)return {svg:svgMessage("No standards with a stored quantity in this run / target."),rows:[]};
    const cm=new Map(),series=[],texts=[];let ty=46;
    scs.forEach(sc=>{const col=catColour(cm,sc.target);
      series.push({type:"points",colour:col,data:sc.points.map(p=>[p.x,p.y,`${p.well} ${p.sample} · ${p.conc} · Cq ${num(p.y,2)} · residual ${num(p.residual,3)}`])});
      const xs=sc.points.map(p=>p.x),a=Math.min(...xs),b=Math.max(...xs);
      series.push({type:"line",colour:col,data:[[a,sc.intercept+sc.slope*a],[b,sc.intercept+sc.slope*b]]});
      const R=SOP.run,ok=sc.r2>=R.minR2&&sc.efficiency>=R.effMin&&sc.efficiency<=R.effMax&&sc.logs>=R.minLogs&&sc.monotonic;
      texts.push({px:80,py:ty,colour:ok?"#15803d":"#b91c1c",text:`${sc.target}: slope ${num(sc.slope,3)} · R² ${num(sc.r2,4)} (≥${R.minR2}) · E ${sc.efficiency>1000||sc.efficiency<-100?"out of range":num(sc.efficiency,1)+" %"} (${R.effMin}–${R.effMax}) · ${num(sc.logs,1)} logs (≥${R.minLogs})${sc.monotonic?"":" · out of order"} — ${ok?"within SOP":"outside SOP"}`});ty+=15;
    });
    const all=scs.flatMap(s=>s.points);
    return {svg:svgPlot({title:runName(c.run),x:extent(all.map(p=>p.x)),y:extent(all.map(p=>p.y),0.25),xlab:"log10 quantity (stored)",ylab:"Stored Cq",series,texts,legend:legendFromMap(cm)}),
      rows:scs.flatMap(s=>s.points.map(p=>({target:s.target,well:p.well,sample:p.sample,quantity:p.conc,log10_quantity:p.x,cq:p.y,fitted:s.intercept+s.slope*p.x,residual:p.residual,slope:s.slope,intercept:s.intercept,r2:s.r2,efficiency_percent:s.efficiency})))};
  }},
 {id:"ic",group:"Results",title:"Internal control / reference Cq per sample (inhibition)",scope:"run",
  note:"Cq of the targets the SOP marks as internal control or reference. The band is the run median ± the SOP maximum IC shift; points above it suggest inhibition or low input.",
  render(c){
    const ev=sopEvaluateAll()[c.ri];const rs=ev.rows.filter(r=>(r.spec.kind==="ic"||r.spec.kind==="reference")&&!r.ctrl&&r.role!=="Standard");
    if(!rs.length)return {svg:svgMessage("No target is marked as internal control or reference in the SOP (section 2)."),rows:[]};
    const cm=new Map(),samples=uniq(rs.map(r=>r.sample)),targets=uniq(rs.map(r=>r.target));
    const series=targets.map(t=>({type:"points",colour:catColour(cm,t),r:4.5,data:rs.filter(r=>r.target===t).map(r=>[samples.indexOf(r.sample),Number.isFinite(r.cqMean)?r.cqMean:NaN,`${r.sample} · ${t} · ${num(r.cqMean,2)} · ${r.label}`])}));
    const med=byKey(rs,r=>r.target),bands=[],hl=[];
    med.forEach((list,t)=>{const v=list.map(r=>r.cqMean).filter(Number.isFinite).sort((a,b)=>a-b);if(!v.length)return;const m=v[Math.floor(v.length/2)];
      hl.push({y:m,label:`${t} median ${num(m,2)}`,colour:cm.get(t)});
      if(Number.isFinite(sopNum(SOP.ic.maxShift)))hl.push({y:m+sopNum(SOP.ic.maxShift),label:`${t} +${SOP.ic.maxShift}`,colour:"#b91c1c"});});
    const miss=rs.filter(r=>!Number.isFinite(r.cqMean));
    return {svg:svgPlot({title:runName(c.run)+(miss.length?` — ${miss.length} not detected`:""),x:[-0.7,samples.length-0.3],y:extent(rs.map(r=>r.cqMean).concat(hl.map(h=>h.y)),0.1),
      xticks:samples.length<=40?samples.map((s,i)=>({v:i,label:s.slice(0,14),rotate:-40,anchor:"end"})):[],bottom:samples.length<=40?110:50,
      xlab:samples.length<=40?"":"Samples",ylab:"Mean Cq",series,hlines:hl,legend:legendFromMap(cm)}),
      rows:rs.map(r=>({sample:r.sample,target:r.target,cq_mean:r.cqMean,detected:r.det,n:r.n,run_median:ev.icMedian,outcome:r.outcome}))};
  }},
 {id:"endpoint",group:"Fluorescence",title:"Fluorescence level against Cq",scope:"run",opts:["target","level"],
  note:"End-point fluorescence (or amplitude above background) against the stored Cq. Late, low-plateau curves separate from true amplification; undetected wells are drawn at the right edge.",
  render(c){
    const ws=gRunWells(c.run,c.target).filter(w=>w.curve&&w.curve.length);
    if(!ws.length)return {svg:svgMessage("No curves for this selection."),rows:[]};
    const n=Math.max(...ws.map(w=>w.curve.length)),cm=new Map(),rows=[];
    const pts=ws.map(w=>{const s=wellSignal(w.curve),r=sopOutcomeFor(c.run,w),o=r?r.outcome:"Not interpreted",q=sopCq(w);cm.set(sopLabel(o),sopColour(o));
      const y=c.level==="amplitude"?s.amplitude:s.end;rows.push({well:w.well,sample:w.sample,target:w.target,cq:Number.isFinite(q)?q:"",end_fluorescence:s.end,background:s.background,amplitude:s.amplitude,outcome:o});
      return [Number.isFinite(q)?q:n+1,y,`${w.well} ${w.sample} · Cq ${num(q,2)} · ${num(y,1)} · ${sopLabel(o)}`,sopColour(o)];});
    return {svg:svgPlot({title:`${runName(c.run)} — ${c.target||"all targets"}`,x:[Math.min(...pts.map(p=>p[0]))-1,n+2],y:extent(pts.map(p=>p[1])),
      xlab:`Stored Cq (undetected at ${n+1})`,ylab:c.level==="amplitude"?"Amplitude above background":"End-point fluorescence",
      series:[{type:"points",data:pts}],vlines:gCutLines(c.target,"x"),legend:legendFromMap(cm)}),rows};
  }},
 {id:"levels",group:"Fluorescence",title:"Background and plateau fluorescence per channel",scope:"run",
  note:"For each detection channel / target: background (mean of cycles 3–10) and end-point fluorescence of every well, including wells outside the analyses. A shifted background points to plate, seal or optical problems.",
  render(c){
    const items=[...(c.run.wells||[]).filter(w=>w.curve&&w.curve.length).map(w=>({w,key:w.filterComb||w.target||String(w.channel),outside:false})),
      ...orphanCurveCandidates(c.run).map(o=>({w:o,key:o.filterComb||o.filterName||String(o.channel),outside:true}))];
    const seen=new Set(),uniqItems=items.filter(i=>{const k=`${i.key}|${i.w.pos}`;if(seen.has(k))return false;seen.add(k);return true;});
    if(!uniqItems.length)return {svg:svgMessage("No curves."),rows:[]};
    const keys=uniq(uniqItems.map(i=>i.key)),rows=[];
    const bg=[],end=[];
    uniqItems.forEach((i,k)=>{const s=wellSignal(i.w.curve),x=keys.indexOf(i.key),j=((k*29)%19-9)/60;
      bg.push([x-0.18+j,s.background,`${i.w.well} background ${num(s.background,1)}${i.outside?" (outside analyses)":""}`,i.outside?"#f59e0b":"#60a5fa"]);
      end.push([x+0.18+j,s.end,`${i.w.well} end ${num(s.end,1)}${i.outside?" (outside analyses)":""}`,i.outside?"#b45309":"#1d4ed8"]);
      rows.push({channel:i.key,well:i.w.well,sample:i.w.sample||"",outside_analyses:i.outside?"yes":"",background:s.background,end_fluorescence:s.end,amplitude:s.amplitude});});
    const all=bg.concat(end).map(p=>p[1]).filter(v=>v>0);
    return {svg:svgPlot({title:runName(c.run),x:[-0.6,keys.length-0.4],y:[Math.max(1e-3,Math.min(...all)*0.8),Math.max(...all)*1.3],ylog:true,
      xticks:keys.map((k,i)=>({v:i,label:k})),xlab:"Channel / target",ylab:"Fluorescence (log scale)",
      series:[{type:"points",data:bg,r:3},{type:"points",data:end,r:3}],
      legend:[{label:"background",colour:"#60a5fa"},{label:"end point",colour:"#1d4ed8"},{label:"outside analyses",colour:"#f59e0b"}]}),rows};
  }},
 {id:"outcomes",group:"Results",title:"SOP outcomes per target",scope:"run",
  note:"Number of sample/target results per outcome under the active SOP, controls included.",
  render(c){
    const ev=sopEvaluateAll()[c.ri];const ts=uniq(ev.rows.map(r=>r.target));
    if(!ts.length)return {svg:svgMessage("No results."),rows:[]};
    const outs=SOP_OUTCOMES.filter(o=>ev.rows.some(r=>r.outcome===o)),series=[],rows=[];
    const base=ts.map(()=>0);
    outs.forEach(o=>{const data=ts.map((t,i)=>{const n=ev.rows.filter(r=>r.target===t&&r.outcome===o).length;const p=[i,base[i]+n,base[i],`${t}: ${n} ${sopLabel(o)}`,sopColour(o)];base[i]+=n;if(n)rows.push({target:t,outcome:o,count:n});return p;}).filter(p=>p[1]>p[2]);
      series.push({type:"bar",colour:sopColour(o),barWidth:Math.min(60,600/ts.length),data});});
    return {svg:svgPlot({title:`${runName(c.run)} — run ${ev.status}`,x:[-0.6,ts.length-0.4],y:[0,Math.max(...base)*1.1||1],xticks:ts.map((t,i)=>({v:i,label:t.slice(0,16)})),
      xlab:"Target",ylab:"Results",series,legend:outs.map(o=>({label:sopLabel(o),colour:sopColour(o)}))}),rows};
  }},
 {id:"temperature",group:"Run history",title:"Block, cover and zone temperature (QuantStudio log)",scope:"run",
  note:"From the instrument log inside the .eds file: sample block mean, heated cover and the spread between block zones, against minutes from the first record. The dashed line is the SOP maximum zone spread.",
  render(c){
    const L=c.run.eds&&c.run.eds.log;if(!L||!L.temps.length)return {svg:svgMessage("This graph uses the QuantStudio instrument log. For a LightCycler run choose “Block temperature trace (LightCycler temperature log)”."),rows:[]};
    const t0=L.temps[0][0],step=Math.max(1,Math.floor(L.temps.length/1500)),pts=L.temps.filter((_,i)=>i%step===0);
    const m=t=>(t[0]-t0)/60000;
    const series=[{type:"line",colour:"#2563eb",data:pts.map(t=>[m(t),t[1]]),tip:"sample block"},{type:"line",colour:"#d97706",data:pts.map(t=>[m(t),t[2]]),tip:"cover"},
      {type:"line",colour:"#7c3aed",data:pts.map(t=>[m(t),t[4]*10]),tip:"zone spread ×10"}];
    return {svg:svgPlot({title:runName(c.run),x:[0,m(L.temps[L.temps.length-1])],y:[0,110],xlab:"Minutes from the first log record",ylab:"°C",series,
      hlines:[{y:sopNum(SOP.run.maxZoneSpread)*10,label:`SOP zone spread ${SOP.run.maxZoneSpread} °C (×10)`,colour:"#7c3aed"}],
      legend:[{label:"sample block",colour:"#2563eb"},{label:"heated cover",colour:"#d97706"},{label:"zone spread ×10",colour:"#7c3aed"}]}),
      rows:L.temps.map(t=>({time:sopFmtTime(t[0]),minutes:+m(t).toFixed(3),block_C:t[1],cover_C:t[2],heatsink_C:t[3],zone_spread_C:t[4]}))};
  }},
 {id:"recalc",group:"Run history",title:"Stored Ct against the Ct re-derived on this page",scope:"run",
  note:"QuantStudio only: difference between the stored Ct and the crossing of the stored ΔRn with the stored threshold. Differences beyond ±0.2 require an algorithm/settings/provenance review; they do not prove that stored data were edited.",
  render(c){
    const ws=(c.run.wells||[]).filter(w=>w.eds&&Number.isFinite(w.eds.ctRecalc)&&Number.isFinite(sopCq(w)));
    if(!ws.length)return {svg:svgMessage("No re-derived Ct (QuantStudio files only)."),rows:[]};
    const cm=new Map();
    const series=[{type:"points",data:ws.map(w=>[sopCq(w),sopCq(w)-w.eds.ctRecalc,`${w.well} ${w.sample} · ${w.target} · stored ${num(sopCq(w),3)} · re-derived ${num(w.eds.ctRecalc,3)}`,catColour(cm,w.target)])}];
    return {svg:svgPlot({title:runName(c.run),x:extent(ws.map(sopCq)),y:extent(ws.map(w=>sopCq(w)-w.eds.ctRecalc).concat([-0.3,0.3])),xlab:"Stored Ct",ylab:"Stored − re-derived Ct",series,
      hlines:[{y:0.2,label:"+0.2",colour:"#b91c1c"},{y:-0.2,label:"−0.2",colour:"#b91c1c"},{y:0,label:"",colour:"#9ca3af",dash:"2 3"}],legend:legendFromMap(cm)}),
      rows:ws.map(w=>({well:w.well,sample:w.sample,target:w.target,stored_ct:sopCq(w),rederived_ct:w.eds.ctRecalc,difference:sopCq(w)-w.eds.ctRecalc,threshold:w.eds.threshold}))};
  }},
 /* ----- across all loaded runs ----- */
 {id:"x_timeline",group:"Across runs",title:"Runs on a calendar — run time and last change",scope:"all",
  note:"Each run as a green dot at its start, with the experiment creation (blue, above) and the last recorded change (red, below, joined by a dashed line). Long gaps between run and last change are the first thing an auditor asks about.",
  render(){
    const rs=RUNS.map((r,i)=>({r,i,T:runTimes(r)})).filter(x=>Number.isFinite(x.T.start)).sort((a,b)=>a.T.start-b.T.start);
    if(!rs.length)return {svg:svgMessage("No run carries a start time."),rows:[]};
    const ts=rs.flatMap(x=>[x.T.start,x.T.end,x.T.created,x.T.lastEdit]).filter(Number.isFinite);
    const lo=Math.min(...ts),hi=Math.max(...ts),D=t=>(t-lo)/864e5;
    const series=[],rows=[];
    rs.forEach((x,k)=>{const y=rs.length-k;
      if(Number.isFinite(x.T.lastEdit))series.push({type:"line",colour:"#fca5a5",dash:"3 3",data:[[D(Number.isFinite(x.T.end)?x.T.end:x.T.start),y],[D(x.T.lastEdit),y]]});
      series.push({type:"points",colour:"#16a34a",r:7,data:[[D(x.T.start),y,`${runName(x.r)} run ${sopFmtTime(x.T.start)} – ${sopFmtTime(x.T.end)}`]]});
      if(Number.isFinite(x.T.created))series.push({type:"points",colour:"#2563eb",r:3.5,data:[[D(x.T.created),y+0.18,`created ${sopFmtTime(x.T.created)}`]]});
      if(Number.isFinite(x.T.lastEdit))series.push({type:"points",colour:"#dc2626",r:3.5,data:[[D(x.T.lastEdit),y-0.18,`last change ${sopFmtTime(x.T.lastEdit)} (+${num(x.T.editDelayH,1)} h)`]]});
      rows.push({experiment:runName(x.r),created:sopFmtTime(x.T.created),run_start:sopFmtTime(x.T.start),run_end:sopFmtTime(x.T.end),last_change:sopFmtTime(x.T.lastEdit),hours_to_last_change:x.T.editDelayH,run_minutes:x.T.durationMin});});
    const span=D(hi)||1,ticks=niceTicks(0,span,5).map(v=>({v,label:sopFmtTime(lo+v*864e5).slice(0,10)}));
    return {svg:svgPlot({title:`${rs.length} run(s)`,height:Math.max(260,rs.length*18+100),left:Math.min(300,24+Math.min(40,Math.max(...rs.map(x=>runName(x.r).length)))*6.6),
      x:[-span*0.03,span*1.03],y:[0,rs.length+1],yticks:false,xticks:ticks,xlab:"Date",series,
      texts:rs.map((x,k)=>({x:-span*0.03,y:rs.length-k,text:runName(x.r).slice(0,40)+"  ",anchor:"end",size:10})),
      legend:[{label:"run",colour:"#16a34a"},{label:"created",colour:"#2563eb"},{label:"last change",colour:"#dc2626"}]}),rows};
  }},
 {id:"x_delay",group:"Across runs",title:"Hours from run end to the last recorded change",scope:"all",
  note:"Processing time per run. The dashed line is the SOP maximum; bars above it are flagged in the run acceptance.",
  render(){
    const rs=gByDate(RUNS.map(r=>({r,T:runTimes(r)})).filter(x=>Number.isFinite(x.T.editDelayH)),x=>x.r),tk=gRunTicks(rs.map(x=>x.r));
    if(!rs.length)return {svg:svgMessage("No run has both a run end and a later dated change."),rows:[]};
    const lim=sopNum(SOP.run.editDelayHours),vals=rs.map(x=>x.T.editDelayH);
    const series=[{type:"bar",barWidth:Math.max(3,Math.min(40,700/rs.length)),data:rs.map((x,i)=>[i,Math.max(0.01,x.T.editDelayH),0.01,`${runName(x.r)}: ${num(x.T.editDelayH,1)} h`,x.T.editDelayH>lim?"#dc2626":"#60a5fa"])}];
    return {svg:svgPlot({title:"Processing delay",x:[-0.6,rs.length-0.4],y:[0.01,Math.max(...vals,lim||1)*2],ylog:true,
      xticks:tk.xticks,bottom:tk.bottom,xlab:tk.xlab,
      ylab:"Hours (log scale)",series,hlines:[{y:lim,label:`SOP ${lim} h`,colour:"#b91c1c"}]}),
      rows:rs.map(x=>({experiment:runName(x.r),run_end:sopFmtTime(x.T.end),last_change:sopFmtTime(x.T.lastEdit),hours:x.T.editDelayH}))};
  }},
 {id:"x_accept",group:"Across runs",title:"Run acceptance grid",scope:"all",
  note:"Runs (rows) against the SOP criteria (columns): green met, amber review, red rejected, grey not applicable.",
  render(){
    const all=gByDate(sopEvaluateAll(),e=>e.run);if(!all.length)return {svg:svgMessage("No runs."),rows:[]};
    const crit=uniq(all.flatMap(e=>e.criteria.map(c=>c.criterion.replace(/ — .*/,""))));
    const cw=Math.max(28,Math.min(90,600/crit.length)),rh=18,left=300,top=150,W=left+crit.length*cw+160,H=top+all.length*rh+20;
    const col={pass:"#86efac",review:"#fcd34d",fail:"#f87171","n/a":"#e5e7eb"};
    let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="system-ui,Arial" font-size="10.5"><rect width="${W}" height="${H}" fill="#fff"/><text x="10" y="18" font-size="13" font-weight="600">${svgEsc(SOP.name)} v${svgEsc(SOP.version)}</text>`;
    crit.forEach((c,j)=>{const x=left+j*cw+cw/2;s+=`<text transform="translate(${x+3} ${top-6}) rotate(-50)" fill="#374151">${svgEsc(c)}</text>`;});
    const rows=[];
    all.forEach((e,i)=>{const y=top+i*rh;s+=`<text x="${left-8}" y="${y+13}" text-anchor="end" fill="${e.status==="Rejected"?"#b91c1c":"#111827"}">${svgEsc(runName(e.run).slice(0,40))}</text>`;
      crit.forEach((c,j)=>{const mine=e.criteria.filter(x=>x.criterion.replace(/ — .*/,"")===c);
        const st=mine.some(x=>x.status==="fail")?"fail":mine.some(x=>x.status==="review")?"review":mine.some(x=>x.status==="pass")?"pass":"n/a";
        s+=`<rect x="${left+j*cw+1}" y="${y+1}" width="${cw-2}" height="${rh-2}" rx="3" fill="${col[st]}"><title>${svgEsc(runName(e.run)+"\n"+c+": "+st+"\n"+mine.map(x=>x.evidence).join("\n"))}</title></rect>`;
        rows.push({experiment:runName(e.run),criterion:c,status:st,evidence:mine.map(x=>x.evidence).join(" | ")});});});
    return {svg:s+"</svg>",rows};
  }},
 {id:"x_outcomes",group:"Across runs",title:"SOP outcomes per run",scope:"all",
  note:"Stacked counts of sample/target outcomes for every loaded run.",
  render(){
    const all=gByDate(sopEvaluateAll(),e=>e.run),tk=gRunTicks(all.map(e=>e.run));if(!all.length)return {svg:svgMessage("No runs."),rows:[]};
    const outs=SOP_OUTCOMES.filter(o=>all.some(e=>e.rows.some(r=>r.outcome===o))),base=all.map(()=>0),series=[],rows=[];
    outs.forEach(o=>{series.push({type:"bar",colour:sopColour(o),barWidth:Math.max(3,Math.min(40,700/all.length)),data:all.map((e,i)=>{const n=e.rows.filter(r=>r.outcome===o).length;const p=[i,base[i]+n,base[i],`${runName(e.run)}: ${n} ${sopLabel(o)}`,sopColour(o)];base[i]+=n;if(n)rows.push({experiment:runName(e.run),outcome:o,count:n});return p;}).filter(p=>p[1]>p[2])});});
    return {svg:svgPlot({title:"Outcomes per run",x:[-0.6,all.length-0.4],y:[0,Math.max(...base,1)*1.08],
      xticks:tk.xticks,bottom:tk.bottom,xlab:tk.xlab,
      ylab:"Results",series,legend:outs.map(o=>({label:sopLabel(o),colour:sopColour(o)}))}),rows};
  }},
 {id:"x_control",group:"Across runs",title:"Control Cq across runs with SOP range",scope:"all",opts:["control","target"],
  note:"Descriptive control overview. Solid band: configured SOP range. No pooled statistical limits; use extraction-batch charts for comparable groups.",
  render(c){
    const ctrl=SOP.controls[Number(c.control)];if(!ctrl)return {svg:svgMessage("Define a control in the SOP (section 3)."),rows:[]};
    const all=gByDate(sopEvaluateAll(),e=>e.run),pts=[],tk=gRunTicks(all.map(e=>e.run));
    all.forEach((e,i)=>e.rows.filter(r=>r.ctrl===ctrl&&(!c.target||r.target===c.target)).forEach(r=>pts.push({i,e,r})));
    if(!pts.length)return {svg:svgMessage("The chosen control was not found in the loaded runs."),rows:[]};
    if(!pts.some(p=>Number.isFinite(p.r.cqMean)))return {svg:svgMessage(`${ctrl.name}${c.target?" · "+c.target:""}: no Cq in any of the ${pts.length} control result(s) in ${uniq(pts.map(p=>p.i)).length} run(s)${ctrl.expect==="negative"?" — as expected for a negative control":""}. Choose a positive control to see a Levey-Jennings chart.`),
      rows:pts.map(p=>({experiment:runName(p.e.run),sample:p.r.sample,target:p.r.target,cq_mean:p.r.cqMean,detected:p.r.det,n:p.r.n,outcome:p.r.outcome}))};
    const cm=new Map(),series=[],det=pts.filter(p=>Number.isFinite(p.r.cqMean));
    byKey(pts,p=>p.r.target).forEach((ps,t)=>series.push({type:"points",colour:catColour(cm,t),r:4.5,data:ps.map(p=>[p.i,Number.isFinite(p.r.cqMean)?p.r.cqMean:NaN,`${runName(p.e.run)} · ${p.r.sample} · ${t} · ${num(p.r.cqMean,2)} · ${p.r.label}`])}));
    byKey(det,p=>`${p.r.target}|${p.r.sample}|${ccInstrumentKey(p.e.run)}|${ccProtocolKey(p.e.run)}`).forEach((ps,t)=>series.push({type:"line",colour:cm.get(t),width:1,opacity:0.5,data:ps.map(p=>[p.i,p.r.cqMean])}));
    const v=det.map(p=>p.r.cqMean),m=mean(v),s=sd(v),hl=[];
    const lo=sopNum(ctrl.cqLo),hi=sopNum(ctrl.cqHi),bands=[];
    if(Number.isFinite(lo)||Number.isFinite(hi))bands.push({y0:Number.isFinite(lo)?lo:0,y1:Number.isFinite(hi)?hi:60,colour:"#16a34a",opacity:0.1});
    const ys=v.concat(hl.map(h=>h.y)).concat([lo,hi].filter(Number.isFinite));
    return {svg:svgPlot({title:`${ctrl.name}${c.target?" · "+c.target:""} — ${det.length}/${pts.length} detected`,x:[-0.6,all.length-0.4],y:extent(ys.length?ys:[0,40],0.1),
      xticks:tk.xticks,bottom:tk.bottom,xlab:tk.xlab,
      ylab:"Mean Cq",series,hlines:hl,bands,legend:legendFromMap(cm)}),
      rows:pts.map(p=>({experiment:runName(p.e.run),sample:p.r.sample,target:p.r.target,cq_mean:p.r.cqMean,detected:p.r.det,n:p.r.n,outcome:p.r.outcome}))};
  }},
 {id:"x_signal",group:"Across runs",title:"Background and plateau fluorescence across runs",scope:"all",
  note:"Median background and median end-point fluorescence of every channel per run: slow drift here is an instrument or reagent trend.",
  render(){
    const med=a=>{const v=a.filter(Number.isFinite).sort((x,y)=>x-y);return v.length?v[Math.floor(v.length/2)]:NaN;};
    const rows=[],cm=new Map(),byCh=new Map();
    const RR=gByDate(RUNS,r=>r),tk=gRunTicks(RR);
    RR.forEach((r,i)=>{const g=byKey((r.wells||[]).filter(w=>w.curve&&w.curve.length),w=>w.filterComb||w.target||String(w.channel));
      g.forEach((ws,ch)=>{const seen=new Set(),sig=ws.filter(w=>!seen.has(w.pos)&&seen.add(w.pos)).map(w=>wellSignal(w.curve));
        const row={experiment:runName(r),channel:ch,median_background:med(sig.map(s=>s.background)),median_end:med(sig.map(s=>s.end)),wells:sig.length};rows.push(row);
        if(!byCh.has(ch))byCh.set(ch,[]);byCh.get(ch).push([i,row.median_background,row.median_end]);});});
    if(!rows.length)return {svg:svgMessage("No curves."),rows:[]};
    const series=[];byCh.forEach((pts,ch)=>{const col=catColour(cm,ch);
      series.push({type:"line",colour:col,dash:"4 3",data:pts.map(p=>[p[0],p[1]]),tip:ch+" background"});
      series.push({type:"line",colour:col,width:2,data:pts.map(p=>[p[0],p[2]]),tip:ch+" end point"});
      series.push({type:"points",colour:col,data:pts.map(p=>[p[0],p[2],`${ch} end ${num(p[2],0)}`])});});
    const all=rows.flatMap(r=>[r.median_background,r.median_end]).filter(v=>v>0);
    return {svg:svgPlot({title:"Solid: end point · dashed: background",x:[-0.6,RR.length-0.4],y:[Math.min(...all)*0.7,Math.max(...all)*1.4],ylog:true,
      xticks:tk.xticks,bottom:tk.bottom,xlab:tk.xlab,
      ylab:"Median fluorescence (log)",series,legend:legendFromMap(cm)}),rows};
  }},
 {id:"x_duration",group:"Across runs",title:"Run duration and instrument use",scope:"all",
  note:"Minutes from run start to run end, coloured by instrument. A run much shorter than its siblings with the same protocol deserves a look at the log.",
  render(){
    const rs=gByDate(RUNS.map(r=>({r,T:runTimes(r)})).filter(x=>Number.isFinite(x.T.durationMin)),x=>x.r),tk=gRunTicks(rs.map(x=>x.r));
    if(!rs.length)return {svg:svgMessage("No run has both start and end times."),rows:[]};
    const cm=new Map();
    const series=[{type:"bar",barWidth:Math.max(3,Math.min(40,700/rs.length)),data:rs.map((x,i)=>[i,x.T.durationMin,0,`${runName(x.r)}: ${num(x.T.durationMin,1)} min · ${x.r.meta.InstrumentID||x.r.meta.InstrumentName||""}`,catColour(cm,x.r.meta.InstrumentID||x.r.meta.InstrumentName||"instrument")])}];
    return {svg:svgPlot({title:"Run duration",x:[-0.6,rs.length-0.4],y:[0,Math.max(...rs.map(x=>x.T.durationMin))*1.1],
      xticks:tk.xticks,bottom:tk.bottom,xlab:tk.xlab,
      ylab:"Minutes",series,legend:legendFromMap(cm)}),
      rows:rs.map(x=>({experiment:runName(x.r),instrument:x.r.meta.InstrumentID||x.r.meta.InstrumentName||"",software:x.r.meta.SWVersion||"",run_start:sopFmtTime(x.T.start),minutes:x.T.durationMin}))};
  }},
 {id:"x_findings",group:"Across runs",title:"Forensic findings by area (Pareto)",scope:"all",
  note:"Count of error and review findings in the forensic log, grouped by area, largest first.",
  render(){
    const ev=reviewForensicEvents().filter(e=>e.severity==="error"||e.severity==="review");
    if(!ev.length)return {svg:svgMessage("No error or review findings."),rows:[]};
    const g=[...byKey(ev,e=>e.area)].map(([a,l])=>({area:a,errors:l.filter(e=>e.severity==="error").length,reviews:l.filter(e=>e.severity==="review").length})).sort((a,b)=>(b.errors+b.reviews)-(a.errors+a.reviews));
    const bw=Math.min(50,600/g.length);
    return {svg:svgPlot({title:"Findings",x:[-0.6,g.length-0.4],y:[0,Math.max(...g.map(x=>x.errors+x.reviews))*1.1],bottom:140,left:110,
      xticks:g.map((x,i)=>({v:i,label:x.area.slice(0,22),rotate:-40,anchor:"end"})),ylab:"Findings",
      series:[{type:"bar",colour:"#dc2626",barWidth:bw,data:g.map((x,i)=>[i,x.errors,0,`${x.area}: ${x.errors} error(s)`])},
        {type:"bar",colour:"#f59e0b",barWidth:bw,data:g.map((x,i)=>[i,x.errors+x.reviews,x.errors,`${x.area}: ${x.reviews} review item(s)`])}],
      legend:[{label:"error",colour:"#dc2626"},{label:"review",colour:"#f59e0b"}]}),rows:g};
  }}
];
