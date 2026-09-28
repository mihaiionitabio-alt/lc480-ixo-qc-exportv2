function ccTransitions(t,y,pairs,band=0.5){
  if(!t||t.length<10||!pairs.length)return null;
  /* edge crossings are interpolated between log samples: at 4.4 °C/s the LightCycler moves ≈ 1.8 °C between two
     samples, more than the ±0.5 °C band, so a sample-by-sample test would miss short passes through a target */
  const exp=new Set(pairs.map(p=>`${p.from}→${p.to}`)),targets=uniq(pairs.flatMap(p=>[p.from,p.to]));
  const inB=(v,s)=>Math.abs(v-s)<=band,at=(k,level)=>t[k-1]+(t[k]-t[k-1])*((level-y[k-1])/((y[k]-y[k-1])||1e-9));
  const got={};let prev=null,leave=NaN,cand=null;
  for(let k=0;k<y.length;k++){
    if(prev===null){const s0=targets.find(s=>inB(y[k],s));if(s0!==undefined){prev=s0;leave=t[k];}continue;}
    /* a hold at a temperature that is not the next programmed step (start of the run, pre-heat, manual pause):
       after 2 s in its band it becomes the new starting point, without recording a transition */
    if(cand){if(!inB(y[k],cand.s))cand=null;else if(t[k]-cand.since>=2){prev=cand.s;leave=t[k];cand=null;continue;}}
    if(inB(y[k],prev)){leave=t[k];}
    else if(k>0&&inB(y[k-1],prev)){leave=at(k,y[k]>prev?prev+band:prev-band);}    // left the band between two samples
    if(k===0)continue;
    const lo=Math.min(y[k-1],y[k]),hi=Math.max(y[k-1],y[k]);
    for(const s of targets){
      if(s===prev||inB(y[k-1],s)||hi<s-band||lo>s+band)continue;          // this segment enters the band of s
      const key=`${prev}→${s}`;if(!exp.has(key)){if(!cand||cand.s!==s)cand={s,since:t[k]};continue;}   // passing through, not a programmed step
      const edge=y[k-1]<s?s-band:s+band,tin=at(k,edge);
      if(Number.isFinite(leave)&&tin>leave)(got[key]=got[key]||[]).push(tin-leave);
      prev=s;leave=inB(y[k],s)?t[k]:tin;break;
    }
  }
  const o={};for(const [k,v] of Object.entries(got))if(v.length)o[k+" °C"]=ccMedian(v);
  return Object.keys(o).length?o:null;
}
