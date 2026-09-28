function ccCUSUM(y,cfg){
  /* Page's procedure. Two one-sided sums; each one signals when it passes h and is then
     restarted, so an excursion is reported once instead of marking every later run. The
     signal belongs to the sum that raised it (sigHi / sigLo), so the chart can colour the
     series that is actually outside and leave the other one alone. */
  const I=ccI(y,cfg),k=+cfg.k,h=+cfg.h;let hi=0,lo=0;
  return {cl:0,pts:y.map(v=>{
    let sigHi=false,sigLo=false;
    if(Number.isFinite(v)){const z=(v-I.cl)/I.sigma;
      hi=Math.max(0,hi+z-k);lo=Math.max(0,lo-z-k);
      sigHi=hi>h;sigLo=lo>h;}
    const p={y:hi,y2:-lo,raw:v,cl:0,ucl:h,lcl:-h,sigHi,sigLo,
      flags:sigHi?["upward shift (CUSUM)"]:sigLo?["downward shift (CUSUM)"]:[]};
    if(sigHi)hi=0;if(sigLo)lo=0;                 /* restart the sum that signalled */
    return p;})};
}