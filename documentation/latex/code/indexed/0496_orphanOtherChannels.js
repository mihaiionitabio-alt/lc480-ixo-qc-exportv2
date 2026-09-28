function orphanOtherChannels(run,pos,channel){
  const active=(((run.protocol||{}).channels)||[]);
  const out=[];
  [...(run.wells||[]),...(run.tmWells||[]),...(run.genoResults||[]),...(run.otherResults||[])]
    .forEach(w=>{
      if(Number(w.pos)!==pos||Number(w.channel)===channel)return;
      const cq=resultCq(w);
      out.push({channel:Number(w.channel),name:(active[Number(w.channel)]||{}).name||`channel ${w.channel}`,
        target:w.target||w.analysis||"",cq:Number.isFinite(cq)?+cq.toFixed(2):null});
    });
  const seen=new Set();
  return out.filter(o=>{const k=o.channel+"|"+o.target;if(seen.has(k))return false;seen.add(k);return true;});
}
