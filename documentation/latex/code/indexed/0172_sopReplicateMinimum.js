function sopReplicateMinimum(g){
  const by=(SOP.replicates&&SOP.replicates.by_role)||{};
  const keys=[g.role,g.ctrl&&g.ctrl.name,g.ctrl&&g.ctrl.expect,g.ctrl?(g.ctrl.expect==="positive"?"positive control":g.ctrl.expect==="negative"?"negative control":""):"",g.ctrl?"control":"sample"];
  for(const k of keys){if(!k)continue;const n=Number(by[k]);if(Number.isFinite(n)&&n>0)return n;}
  const n=Number(SOP.replicates&&SOP.replicates.min);return Number.isFinite(n)&&n>0?n:1;
}
