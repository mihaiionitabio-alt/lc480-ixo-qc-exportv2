function ccEWMA(y,cfg){
  const I=ccI(y,cfg),lam=+cfg.lambda,L=+cfg.L;let e=I.cl,k=0;
  return {cl:I.cl,pts:y.map(v=>{if(Number.isFinite(v)){e=lam*v+(1-lam)*e;k++;}
    const w=I.sigma*Math.sqrt(lam/(2-lam)*(1-Math.pow(1-lam,2*k)));
    return {y:e,raw:v,cl:I.cl,ucl:I.cl+L*w,lcl:I.cl-L*w,flags:Math.abs(e-I.cl)>L*w?["EWMA beyond limit"]:[]};})};
}
