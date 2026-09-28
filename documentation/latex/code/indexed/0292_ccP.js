function ccP(bad,n,cfg){
  const k=Math.max(Math.min(cfg.phase1,bad.length),Math.min(5,bad.length)),sb=bad.slice(0,k).reduce((s,v)=>s+(v||0),0),sn=n.slice(0,k).reduce((s,v)=>s+(v||0),0);
  const p=sn?sb/sn:0;
  return {cl:p,pts:bad.map((b,i)=>{const ni=n[i],y=ni?b/ni:NaN,e=ni?3*Math.sqrt(p*(1-p)/ni):NaN;
    return {y,cl:p,ucl:Math.min(1,p+e),lcl:Math.max(0,p-e),flags:Number.isFinite(y)&&ni>0&&(p===0?b>0:y>p+e)?[p===0?"event after zero-event baseline":"above p limit"]:[]};})};
}
