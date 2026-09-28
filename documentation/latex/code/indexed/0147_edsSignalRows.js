function edsSignalRows(){
  const out=[];
  RUNS.filter(r=>r.eds).forEach(r=>{
    const p=r.eds,named=new Set(p.plate.wells.filter(w=>w.sample).map(w=>w.i));
    p.plate.wells.forEach(w=>{
      if(!named.has(w.i))return;
      const mc=p.mc.signal[w.i]||{};
      for(let c=0;c<Math.max(p.mc.cycles,p.raw.cycles);c++){
        const row={experiment:runName(r),well:posToWell(w.i,p.plate.cols),sample:exportName(w.sample),cycle:c+1};
        p.mc.dyes.forEach(d=>row["multicomponent_"+d]=(mc[d]||[])[c]??"");
        p.raw.sets.forEach(s=>row["raw_"+s]=((p.raw.data[s]||[])[c]||[])[w.i]??"");
        out.push(row);
      }
    });
  });
  return out;
}
