function detectedControlRoots(){
  const roots=new Map();
  RUNS.forEach(run=>(run.wells||[]).forEach(w=>{
    const automatic=controlCategory(w);if(!automatic)return;
    const mapped=sopControlSpec(w),root=controlProfileRoot(w,mapped)||controlRootName(w.sample||automatic),key=controlRootKey(root);if(!key)return;
    if(!roots.has(key))roots.set(key,{key,root,variants:new Set(),counts:new Map()});
    const r=roots.get(key);r.variants.add(String(w.sample||root));
    r.counts.set(automatic,(r.counts.get(automatic)||0)+1);
  }));
  return [...roots.values()].map(r=>{
    const automaticCategory=[...r.counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
    const override=REVIEW_STATE.controlCategoryOverrides[r.key]||"";
    return {key:r.key,root:r.root,variants:[...r.variants].sort((a,b)=>a.localeCompare(b)),
      automaticCategory,category:override||automaticCategory,override};
  }).sort((a,b)=>a.root.localeCompare(b.root,undefined,{numeric:true,sensitivity:"base"}));
}
