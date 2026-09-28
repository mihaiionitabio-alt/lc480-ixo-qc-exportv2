function reviewControlSeries(grouping){
  grouping=grouping==="root"?"root":"exact";
  const roots=new Map(detectedControlRoots().map(r=>[r.key,r])),map=new Map();
  RUNS.forEach((run,ri)=>{
    const perRun=new Map();
    (run.wells||[]).forEach(w=>{
      const automatic=controlCategory(w);if(!automatic)return;
      const mapped=sopControlSpec(w),rootName=controlProfileRoot(w,mapped)||controlRootName(w.sample||automatic),rootKey=controlRootKey(rootName),root=roots.get(rootKey);
      const category=root?root.category:automatic;if(!category||category==="ignore")return;
      const sample=grouping==="exact"?String(w.sample||category):(root?root.root:controlRootName(w.sample||category));
      const target=w.target||w.analysis||"(all)";
      const identity=grouping==="exact"?String(w.sample||category):rootKey;
      const key=`${grouping}:${identity}||${target}||${ccInstrumentKey(run)}||${ccProtocolKey(run)}`;
      if(!perRun.has(key))perRun.set(key,{sample,category,target,exact:new Set(),values:[],wells:[]});
      const g=perRun.get(key),q=Number(w.CpRaw);g.exact.add(w.sample||"");g.wells.push(w.well);
      if(Number.isFinite(q)&&q>0)g.values.push(q);
    });
    perRun.forEach((g,key)=>{
      if(!map.has(key))map.set(key,{key,sample:g.sample,category:g.category,target:g.target,
        exact:new Set(),points:[]});
      const s=map.get(key);g.exact.forEach(n=>s.exact.add(n));
      s.points.push({experiment:runName(run),date:(run.meta||{}).StartTime||(run.meta||{}).Created||"",
        tick:displayRunTick(run,ri),cq:g.values.length?mean(g.values):null,n:g.values.length,
        wells:g.wells.join(" ")});
    });
  });
  return [...map.values()].map(s=>{
    s.points.sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
    const values=s.points.map(p=>p.cq).filter(Number.isFinite),need=ccBaselineNeed(ccCfg("pc_cq")),base=values.slice(0,need),m=mean(base),d=sd(base);
    const flags=grouping==="exact"&&values.length>=need?westgardReview(s.points,m,d):s.points.map(()=>[]);
    s.points.forEach((p,i)=>p.flags=flags[i].join(" "));
    return Object.assign(s,{exact:[...s.exact],runs:s.points.length,n:values.length,mean:m,sd:d,
      cv:cv(values),judgeable:grouping==="exact"&&values.length>=need&&Number.isFinite(d)&&d>0,
      flagged:flags.filter(x=>x.length).length});
  }).sort((a,b)=>(Number(b.judgeable)-Number(a.judgeable))||b.n-a.n||b.runs-a.runs
    ||a.sample.localeCompare(b.sample)||a.target.localeCompare(b.target));
}
