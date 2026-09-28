function ccC(count,cfg){
  const c=mean(ccPhase(count,cfg.phase1)),e=3*Math.sqrt(c);
  return {cl:c,pts:count.map(v=>({y:v,cl:c,ucl:c+e,lcl:Math.max(0,c-e),flags:v>c+e&&v>0?["above c limit"]:[]}))};
}
