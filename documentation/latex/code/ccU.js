function ccU(count,expo,cfg){
  const k=Math.max(Math.min(cfg.phase1,count.length),Math.min(5,count.length)),u=count.slice(0,k).reduce((s,v)=>s+v,0)/(expo.slice(0,k).reduce((s,v)=>s+v,0)||1);
  return {cl:u,pts:count.map((c,i)=>{const y=c/expo[i],e=3*Math.sqrt(u/expo[i]);return {y,cl:u,ucl:u+e,lcl:Math.max(0,u-e),flags:y>u+e?["above u limit"]:[]};})};
}