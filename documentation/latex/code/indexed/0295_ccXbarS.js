function ccXbarS(groups,cfg){               // groups: [{mean,sd,n}]
  const ph=groups.slice(0,Math.max(Math.min(cfg.phase1,groups.length),Math.min(5,groups.length))).filter(g=>g&&Number.isFinite(g.mean));
  const X=mean(ph.map(g=>g.mean)),S=mean(ph.map(g=>g.sd).filter(Number.isFinite));
  /* three-way chart (Wheeler): the limits of the run means use the larger of the within-run spread (A3·S̄) and the
     run-to-run moving range of the means (MR̄/1.128). With many readings per run the within-run S alone gives limits
     far narrower than the normal day-to-day variation and would flag almost every run. */
  const mr=ph.slice(1).map((g,i)=>Math.abs(g.mean-ph[i].mean)),sigB=mr.length?mean(mr)/1.128:0;
  return {cl:X,sbar:S,sigB,pts:groups.map(g=>{if(!g||!Number.isFinite(g.mean))return {y:NaN,cl:X,flags:[]};
    const n=Math.max(2,g.n||2),c4=CC_C4(n),A3=3/(c4*Math.sqrt(n)),B4=1+3*Math.sqrt(1-c4*c4)/c4,w=Math.max(A3*S,3*sigB,1.5*(cfg.res||0));
    const f=[];if(Math.abs(g.mean-X)>w)f.push("mean beyond limit");if(g.sd>B4*S)f.push("spread (S) beyond limit");
    return {y:g.mean,s:g.sd,cl:X,ucl:X+w,lcl:X-w,sUcl:B4*S,flags:f};})};
}
