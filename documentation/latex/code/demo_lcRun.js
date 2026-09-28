function lcRun(tpl,o){
  const r=clone(tpl);
  const cal=(globalThis.QPCR_DEMO_CAL||{})[o.inst];
  const q=(v,step)=>step?Math.round(v/step)*step:v;
  const day=864e5,years=(o.date-Date.parse("2024-01-01T00:00:00Z"))/(365.25*day),season=Math.sin(2*Math.PI*((new Date(o.date).getUTCDate()+new Date(o.date).getUTCMonth()*30)-110)/365.25);
  let plate=1,thermal=Object.assign({},o.thermal);
  if(cal){
    const pm=cal.plate_mix,u=rnd();plate=u<pm.p_low?pm.low[0]+rnd()*(pm.low[1]-pm.low[0]):u<pm.p_low+pm.p_high?pm.high[0]+rnd()*(pm.high[1]-pm.high[0]):1;
    const before=o.date<Date.parse("2025-05-12T00:00:00Z"),h=cal.heat_rate,c=cal.cool_rate,st=cal.settling,ht=cal.hold_temp;
    thermal.heat=q(h[before?"before_service":"after_service"]+h.sigma*gauss(),QPCR_DEMO_CAL.quant.rate);
    thermal.cool=q(c.start+(c.end-c.start)*Math.max(0,Math.min(1,years/2.2))-c.summer*season+c.sigma*gauss(),QPCR_DEMO_CAL.quant.rate);
    thermal.overshoot=q(cal.overshoot[0]+cal.overshoot[1]*gauss(),QPCR_DEMO_CAL.quant.overshoot);
    thermal.undershoot=0.15;thermal.offset=ht[before?"before_service":"after_service"]+ht.sigma*gauss();
    thermal.tau=0.48;thermal.readOffset=thermal.offset;
    const stepQ=QPCR_DEMO_CAL.quant.settling,sv=st[before?"before_service":"after_service"];
    thermal.settling=q(sv+(rnd()<st.p_step?(rnd()<0.5?-stepQ:stepQ):0),stepQ);
    o.expo=Object.keys(cal.exposure).sort().map(k=>Math.max(1,Math.round((cal.exposure[k][0]*Math.pow(1/plate,0.3)+cal.exposure[k][1]*gauss())/QPCR_DEMO_CAL.quant.exposure)));
    o.lampRef=Object.keys(cal.lamp_ref).sort().map(k=>Math.round(cal.lamp_ref[k][0]));
  }
  const names=new Map();let k=0;
  const nameFor=s=>{if(names.has(s))return names.get(s);let v;
    if(/blank|extr/i.test(s))v=(/mac|mix|reag/i.test(s)?"Blank MAC ":"Blank EXTR ")+(o.controlDate||"01.03.2026");
    else if(/^CN/i.test(s))v="CN DEMO MAIZE "+(o.controlDate||"01.03.2026");
    else if(/^(415b|410cp|CRM|control)/i.test(s))v="DEMO LOD "+(o.controlDate||"01.03.2026");
    else if(/^Sample \d+$/.test(s))v=Number(s.split(" ")[1])%3===0?"NTC":s;
    else v=`DEMO-${o.tag}-${pad(++k,3)}`;
    names.set(s,v);return v;};
  (r.wells||[]).forEach(w=>{w.sample=nameFor(w.sample||"");});
  Object.values(r.plate||{}).forEach(p=>{p.name=nameFor(p.name||"");});
  const map=new Map([...names].filter(([a,b])=>a&&a!==b));
  const m=r.meta;
  [["name",o.name],["CreatedByName",o.op],["LastModifiedByName",o.op],["Technician",o.op],["InstrumentID",o.inst],["PlateID",hex(8).toUpperCase()],
   ["UID",hex(32).toUpperCase()],["sourceSHA256","demo"+hex(36)],["sourceCRC32",hex(8)],["Notes","SYNTHETIC demonstration run — made-up data"]].forEach(([a,b])=>{if(m[a])map.set(m[a],b);m[a]=b;});
  map.set(tpl.meta.name,o.name);
  const df=(r.protocol||{}).detectionFormatName;if(df&&!/^(SCR|Mono Color|Dual Color)/i.test(df))map.set(df,"DEMO-FORMAT");
  (r.analyses||[]).forEach(a=>{a.createdBy=a.modifiedBy=o.op;a.uid=hex(30).toUpperCase();a.quantStats=[];});
  r.identities={Id:[r.blockId],InstrumentID:[o.inst],PlateID:[m.PlateID],OwnerUID:[hex(30).toUpperCase()],UID:[m.UID],SubsetID:["0"]};
  replaceStrings(r,map);
  r.file=r.sourcePath=o.name+".ixo";
  shiftDates(r,o.date-Date.parse(tpl.meta.StartTime+"Z"));
  if(o.editDelayH!==undefined){const e=Date.parse(m.EndTime+"Z")+o.editDelayH*3600e3;m.LastModified=new Date(e).toISOString().slice(0,23);
    (r.analyses||[]).forEach(a=>{a.modified=new Date(e-60e3).toISOString().slice(0,23);});}
  /* curves and Cq */
  const byKey=new Map();
  Object.entries(r.allCurves||{}).forEach(([key,c])=>{
    const tw=(tpl.wells||[]).find(w=>`${w.channel}|${w.pos}`===key),src=c.curve,n=src.length;
    const channel=tw&&/533-580|channel.?1/i.test(String(tw.channel))?"533-580":"465-510",bg=cal&&cal.bg_median[channel],plat=cal&&cal.plateau_median[channel];
    const base=bg?Math.max(100,bg[0]*plate+bg[1]*0.55*gauss()):ccMedian(src.slice(0,5))*(1+0.03*gauss());
    const label=tw?nameFor(tw.sample||""):"",ref=tw&&/HMG|LEC/i.test(tw.target||"");
    const pos=/DEMO LOD/.test(label)||(/CN DEMO/.test(label)?ref:!/Blank|NTC/.test(label)&&rnd()>0.3);
    const age=(o.date-Date.parse((o.controlDate||"01.03.2026").split('.').reverse().join('-')+'T00:00:00Z'))/864e5;
    const cq=pos?(ref?23:/DEMO LOD/.test(label)?31.5+0.006*age:26+3*rnd())+o.cqShift+0.15*gauss():NaN;
    const amp=pos?Math.max(50,(plat?plat[0]*(0.5+0.5*plate):base+900)-base)*(o.ampFactor||1):0;
    const cv=curve(n,base,amp,cq,1.55+0.1*rnd(),cal?0.008:0.003,0.01*gauss());
    c.curve=cv;c.amplitude=pos?amp:Math.abs(cv[n-1]-cv[0]);byKey.set(key,{cv,cq});});
  (r.wells||[]).forEach(w=>{const g=byKey.get(`${w.channel}|${w.pos}`);if(!g)return;w.curve=g.cv;
    if(Number.isFinite(g.cq)){w.Cp=w.CpRaw=+g.cq.toFixed(2);}else if(w.Cp>0){w.Cp=w.CpRaw=0;w.call="Negative";w.callCode=1;}
    w.CalcConc=w.CalcConcUnc="";});
  if(o.ntcPositive){const bw=(r.wells||[]).filter(w=>/blank/i.test(w.sample)&&w.channel===0).slice(0,1);   // deliberate contamination example
    bw.forEach(w=>{const n=w.curve.length,base=w.curve[0];w.curve=curve(n,base,900,35.6,1.6,0.003);w.Cp=w.CpRaw=35.6;w.call="Positive";w.callCode=2;
      const kk=`${w.channel}|${w.pos}`;if(r.allCurves[kk])r.allCurves[kk].curve=w.curve;});}
  if(o.copyFrom){const [a,b]=o.copyFrom;const wa=r.wells.find(w=>w.well===a),wb=r.wells.find(w=>w.well===b);   // deliberate forensic example
    if(wa&&wb){wb.curve=wa.curve.slice();wb.Cp=wb.CpRaw=wa.Cp;const ka=`${wa.channel}|${wa.pos}`,kb=`${wb.channel}|${wb.pos}`;if(r.allCurves[kb])r.allCurves[kb].curve=r.allCurves[ka].curve.slice();}}
  /* instrument side: temperature log, acquisitions */
  const tr=thermalTrace(r.protocol.programs,thermal);
  const pairs=ccTransitionPairs(r);
  r.cc={thermal:ccThermalSummary(ccThermalSteps(tr.seconds,tr.temp,ccSetpoints(r)),ccPeakRates(tr.seconds,tr.temp,2)),
    templogLate:{bad:o.lateLog||0,n:tr.seconds.length-1},log:ccThin(tr.seconds,tr.temp,1800)};
  const trn=ccTransitions(tr.seconds,tr.temp,pairs,0.5);if(trn)r.cc.thermal.transition=trn;
  const refs={0:o.lampRef?.[0]??7100,1:o.lampRef?.[1]??20400},jumps={0:rnd()<0.03?(rnd()<0.5?-1:1)*(150+200*rnd()):0,1:rnd()<0.03?(rnd()<0.5?-1:1)*(150+200*rnd()):0};
  const spL=ccSetpoints(r),acq=(tpl.cc.acq||[]).slice().sort((a,b)=>a.ms-b.ms).map(a=>({ms:a.ms,temp:+(spL.reduce((b,s)=>Math.abs(s-a.temp)<Math.abs(b-a.temp)?s:b,spL[0])+thermal.readOffset+0.03*gauss()).toFixed(2),
    channel:a.channel,intgr:Math.max(40,Math.round((a.channel?o.expo[1]:o.expo[0])*(1+0.02*gauss()))),valid:rnd()>(o.invalid||0),ref:+(Math.max(0,refs[a.channel]+jumps[a.channel])*(1+0.002*gauss())).toFixed(1)}));
  if(cal&&acq.length){const channels=uniq(acq.map(a=>a.channel)),target=cal.chan_switch[0],sigma=cal.chan_switch[1],cycleSigma=cal.cycle_sd[1];
    for(let i=1;i<acq.length;i++){const prior=acq[i-1],next=acq[i];
      if(next.channel===prior.channel+1)next.ms=prior.ms+prior.intgr+Math.min(1051,Math.max(1038,Math.round(target+sigma*gauss())));
      else if(next.channel===channels[0])next.ms=prior.ms+prior.intgr+target+sigma*gauss()+Math.max(0,Math.round(2*target+o.expo[0]+o.expo[1]+cycleSigma*gauss()-prior.intgr-target));
    }}
  r.cc.acq=acq;
  r.ccStatic=null;r.synthetic=true;
  return r;
}