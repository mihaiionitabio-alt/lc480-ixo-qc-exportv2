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