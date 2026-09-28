/* ===== SYNTHETIC DEMONSTRATION DATA — every value produced here is made up =====
   Template runs decoded from real files give only the STRUCTURE (plate format, protocol, channel set).
   All names, dates, identifiers, curves, Cq values, temperature and instrument logs are regenerated
   from seeded random numbers, so no real sample or measurement survives. */
(function(){
let SEED=20260921;
const rnd=()=>{SEED|=0;SEED=SEED+0x6D2B79F5|0;let t=Math.imul(SEED^SEED>>>15,1|SEED);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const gauss=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const hex=n=>Array.from({length:n},()=>"0123456789abcdef"[Math.floor(rnd()*16)]).join("");
const pad=(n,w=2)=>String(n).padStart(w,"0");
function clone(run){const z=run.zip,s=run.sourceArchive;run.zip=null;run.sourceArchive=null;
  let c;try{c=structuredClone(run);}finally{run.zip=z;run.sourceArchive=s;}return c;}
/* ---- dates: every ISO string and every epoch number in the clone moves by the same offset ---- */
function shiftDates(obj,dms){
  const iso=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
  const seen=new WeakSet();
  const walk=(o,depth)=>{if(!o||typeof o!=="object"||depth>9)return;
    if(ArrayBuffer.isView(o)||seen.has(o))return;seen.add(o);
    for(const k of Object.keys(o)){const v=o[k];
      if(typeof v==="string"){const m=v.match(iso);if(m){const zone=m[8]||"",t=Date.parse(v+(zone?"":"Z"))+dms,d=new Date(t);
          o[k]=`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}${m[7]?"."+pad(d.getUTCMilliseconds(),3):""}${zone}`;}}
      else if(typeof v==="number"&&v>1.3e9&&v<2.2e9&&/^(first|last|start|end|mfTime|ts|exp)$/.test(k))o[k]=v+dms/1000;
      else if(typeof v==="number"&&v>1.3e12&&v<2.2e12)o[k]=v+dms;
      else if(v&&typeof v==="object")walk(v,depth+1);}};
  walk(obj,0);
}
/* ---- strings: every text that could identify a sample, person, instrument or file is replaced ---- */
function replaceStrings(obj,map){
  const keys=[...map.keys()].filter(k=>k&&k.length>=2).sort((a,b)=>b.length-a.length);
  const seen=new WeakSet();
  const walk=(o,depth)=>{if(!o||typeof o!=="object"||depth>10||ArrayBuffer.isView(o)||seen.has(o))return;seen.add(o);
    if(o instanceof Map){for(const [k,v] of o){if(typeof v==="string")o.set(k,rep(v));else walk(v,depth+1);}return;}
    for(const k of Object.keys(o)){const v=o[k];if(typeof v==="string")o[k]=rep(v);else if(v&&typeof v==="object")walk(v,depth+1);}};
  const rep=s=>{if(map.has(s))return map.get(s);let out=s;for(const k of keys)if(out.includes(k))out=out.split(k).join(map.get(k));return out;};
  walk(obj,0);
}
/* ---- amplification curve: logistic with the 2nd-derivative maximum at the chosen Cq ---- */
function curve(n,base,amp,cq,slope=1.6,noise=0.004,drift=0){
  const x0=Number.isFinite(cq)?cq+1.317*slope:Infinity;
  return Array.from({length:n},(_,i)=>{const c=i+1;return base*(1+drift*c/n)+(Number.isFinite(x0)?amp/(1+Math.exp(-(c-x0)/slope)):0)+base*noise*gauss();});
}
/* ---- block temperature: a simple thermal model run through the program ---- */
function thermalTrace(programs,p){
  /* the block ramps at min(programmed, available) rate, runs past the target by the overshoot (heating to the
     denaturation step) or undershoot (cooling), then relaxes exponentially onto target + offset */
  const dt=p.dt||0.41,t=[],y=[];let T=p.start??28,time=0;
  const push=v=>{t.push(+time.toFixed(3));y.push(+(v+0.015*gauss()).toFixed(2));time+=dt;};
  const goTo=(target,slope,hold)=>{
    const up=target>T,cap=up?p.heat:p.cool,rate=slope>0?Math.min(cap,slope*(up?p.heat/4.4:p.cool/2.2)):cap;
    const over=up?(target>=90?p.overshoot:p.overshoot*0.35):-(p.undershoot??p.overshoot*0.5);
    const peak=target+over;
    while(up?T<peak:T>peak){T+=(up?1:-1)*rate*dt*(1+0.015*gauss());push(T);}
    const goal=target+p.offset,nh=Math.max(1,Math.round(hold/dt));
    for(let k=0;k<nh;k++){let d=(goal-T)*(1-Math.exp(-dt/p.tau));const lim=(d<0?0.8*p.cool:0.6)*dt;   // relaxation is rate-limited
      if(Math.abs(d)>lim)d=Math.sign(d)*lim;T+=d;push(T);}
  };
  programs.forEach(pr=>{for(let c=0;c<(pr.cycles||1);c++)pr.segments.forEach(s=>goTo(+s.target,+s.slope||0,+s.hold||1));});
  return {seconds:t,temp:y};
}
/* ---- one synthetic LightCycler run from a decoded .ixo template ---- */
function lcRun(tpl,o){
  const r=clone(tpl);
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
    const tw=(tpl.wells||[]).find(w=>`${w.channel}|${w.pos}`===key),src=c.curve,n=src.length,base=ccMedian(src.slice(0,5))*(1+0.03*gauss());
    const label=tw?nameFor(tw.sample||""):"",ref=tw&&/HMG|LEC/i.test(tw.target||"");
    const pos=/DEMO LOD/.test(label)||(/CN DEMO/.test(label)?ref:!/Blank|NTC/.test(label)&&rnd()>0.3);
    const age=(o.date-Date.parse((o.controlDate||"01.03.2026").split('.').reverse().join('-')+'T00:00:00Z'))/864e5;
    const cq=pos?(ref?23:/DEMO LOD/.test(label)?31.5+0.006*age:26+3*rnd())+o.cqShift+0.15*gauss():NaN;
    const amp=pos?(900+200*rnd())*(o.ampFactor||1):0;
    const cv=curve(n,base,amp,cq,1.55+0.1*rnd(),0.003,0.01*gauss());
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
  const tr=thermalTrace(r.protocol.programs,o.thermal);
  const pairs=ccTransitionPairs(r);
  r.cc={thermal:ccThermalSummary(ccThermalSteps(tr.seconds,tr.temp,ccSetpoints(r)),ccPeakRates(tr.seconds,tr.temp,2)),
    templogLate:{bad:o.lateLog||0,n:tr.seconds.length-1},log:ccThin(tr.seconds,tr.temp,1800)};
  const trn=ccTransitions(tr.seconds,tr.temp,pairs,0.5);if(trn)r.cc.thermal.transition=trn;
  const refs={0:o.lampRef?.[0]??7100,1:o.lampRef?.[1]??20400};
  const spL=ccSetpoints(r);r.cc.acq=(tpl.cc.acq||[]).map(a=>({ms:a.ms,temp:+(spL.reduce((b,s)=>Math.abs(s-a.temp)<Math.abs(b-a.temp)?s:b,spL[0])+o.thermal.readOffset+0.03*gauss()).toFixed(2),
    channel:a.channel,intgr:Math.max(40,Math.round((a.channel?o.expo[1]:o.expo[0])*(1+0.08*gauss()))),valid:rnd()>(o.invalid||0),ref:+(refs[a.channel]*(1+0.002*gauss())).toFixed(1)}));
  r.ccStatic=null;r.synthetic=true;
  return r;
}
/* ---- one synthetic QuantStudio run from a decoded .eds template ---- */
function qsRun(tpl,o){
  const r=clone(tpl),E=r.eds;
  const names=new Map();let k=0;
  const nameFor=s=>{if(!s)return s;if(names.has(s))return names.get(s);
    const v=/^NTC|NTC$|blank/i.test(s)?"NTC":/^PC$|pos/i.test(s)?"Positive control":/^NC$|neg/i.test(s)?"Negative control":/^STD|standard/i.test(s)?s:`DEMO-${o.tag}-${pad(++k,3)}`;
    names.set(s,v);return v;};
  (r.wells||[]).forEach(w=>{w.sample=nameFor(w.sample);});
  Object.values(r.plate||{}).forEach(p=>{p.name=nameFor(p.name);});
  const map=new Map([...names].filter(([a,b])=>a&&a!==b));
  const m=r.meta,oldSerial=m.SerialNumber||m.InstrumentID;
  [["name",o.name],["InstrumentID",o.inst],["InstrumentName",o.inst],["SerialNumber",o.inst],["Technician",o.op],["CreatedByName",o.op],["BlockSerial",hex(8)],
   ["OriginalPath",`C:\\Demo\\${o.name}.eds`],["sourceSHA256","demo"+hex(36)],["sourceCRC32",hex(8)],["UID",hex(32)]].forEach(([a,b])=>{if(m[a])map.set(m[a],b);m[a]=b;});
  map.set(tpl.meta.name,o.name);if(oldSerial)map.set(String(oldSerial),o.inst);
  const props=(E.ccLog||{}).props||{};["hostname","serialNumber","blockSerial"].forEach(p=>{if(props[p])map.set(String(props[p]),p==="hostname"?"demo-host":p==="serialNumber"?o.inst:hex(8));});
  replaceStrings(r,map);
  r.file=r.sourcePath=o.name+".eds";if(E){E.file=o.name+".eds";E.sha256="demo"+hex(60);}
  const originalStart=runTimes(tpl).start;
  shiftDates(r,o.date-(Number.isFinite(originalStart)?originalStart:o.date));
  m.StartTime=new Date(o.date).toISOString();m.EndTime=new Date(o.date+5400e3).toISOString();
  if(!r.protocol)r.protocol={};
  if(!r.protocol.programs||!r.protocol.programs.length)r.protocol.programs=[{name:"Synthetic fallback program",cycles:40,segments:[{target:95,hold:15,slope:3.5},{target:60,hold:60,slope:2.8}]}];
  /* curves: ΔRn logistic, Rn = baseline + ΔRn, Ct = threshold crossing */
  const byPos=new Map();
  (r.wells||[]).forEach(w=>{const tw=(tpl.wells||[]).find(x=>x.pos===w.pos&&x.target===w.target&&x.channel===w.channel);if(!tw||!tw.curve)return;
    const n=tw.curve.length,base=1+0.03*gauss(),e=w.eds||{},thr=e.threshold||0.2;
    const pos=!/NTC|Negative control/i.test(w.sample||"");
    const quantity=Number(e.quantity||w.quantity);
    const centre=o.tag==="QC"&&quantity>0?38-3.32*Math.log10(quantity):24+(Number(w.channel)||0)*2;
    const ct=pos?centre+o.cqShift+0.12*gauss():NaN;
    const dAmp=pos?thr*(18+4*rnd()):0;
    const slope=1.4,drn=Array.from({length:n},(_,i)=>{const c=i+1;return (pos?dAmp/(1+Math.exp(-(c-(ct+slope*Math.log(dAmp/thr-1)))/slope)):0)+thr*0.01*gauss();});
    w.curve=drn.map(v=>base+v);
    let cr=NaN;for(let i=1;i<n;i++)if(drn[i-1]<thr&&drn[i]>=thr){cr=i+(thr-drn[i-1])/(drn[i]-drn[i-1]);break;}
    w.Cp=w.CpRaw=Number.isFinite(cr)?+cr.toFixed(3):NaN;
    if(w.eds){w.eds.drn=drn;w.eds.ctRecalc=Number.isFinite(cr)?cr+0.01*gauss():NaN;w.eds.ctDelta=Number.isFinite(cr)?w.eds.ctRecalc-cr:NaN;
      w.eds.undetermined=!Number.isFinite(cr);w.eds.cqConf=Number.isFinite(cr)?0.9+0.09*rnd():0;w.eds.ddct=null;w.eds.dct=NaN;}
    byPos.set(`${w.channel}|${w.pos}`,w.curve);});
  Object.entries(r.allCurves||{}).forEach(([key,c])=>{if(byPos.has(key))c.curve=byPos.get(key);else if(c.curve){const md=ccMedian(Array.from(c.curve))*(o.scale||1);c.curve=Array.from(c.curve,()=>md*(1+0.004*gauss()));}});
  /* groups: mean and SD of the new Cts */
  byKey((r.wells||[]).filter(w=>w.eds),w=>w.sample+"|"+w.target).forEach(ws=>{const v=ws.map(w=>w.Cp).filter(Number.isFinite);
    ws.forEach(w=>{w.eds.ctMean=v.length?mean(v):NaN;w.eds.ctSd=v.length>1?sd(v):NaN;});});
  /* stored relative quantification: recomputed from the synthetic Cts (2^-ΔΔCq) */
  if(Array.isArray(r.rqResults)&&r.rqResults.length){
    const cqOf=(smp,tg)=>(r.wells||[]).filter(w=>w.sample===smp&&w.target===tg).map(w=>w.Cp).filter(Number.isFinite);
    r.rqResults.forEach(q=>{const t=cqOf(q.sample,q.target||q.targetTargetName),f=cqOf(q.sample,q.referenceName);
      q.n=t.length;q.targetCp=t.length?mean(t):NaN;q.targetCpSD=t.length>1?sd(t):NaN;q.refCp=f.length?mean(f):NaN;q.refCpSD=f.length>1?sd(f):NaN;
      q.dctMean=q.targetCp-q.refCp;q.dctSd=Math.hypot(q.targetCpSD||0,q.refCpSD||0);q.dctSe=q.n?q.dctSd/Math.sqrt(q.n):NaN;});
    const cal=r.rqResults.find(q=>q.isCalibrator)||r.rqResults.find(q=>/Positive control/.test(q.sample))||r.rqResults[0];
    r.rqResults.forEach(q=>{q.ddct=q.dctMean-cal.dctMean;q.normRatio=Math.pow(2,-q.ddct);q.concRatio=undefined;q.rqMin=Math.pow(2,-(q.ddct+2*(q.dctSe||0)));q.rqMax=Math.pow(2,-(q.ddct-2*(q.dctSe||0)));q.normRatioSD=NaN;});}
  /* big numeric tables (raw, multicomponent): scaled with noise so no template value survives */
  const jitter=(o2,d)=>{if(!o2||typeof o2!=="object"||d>6)return;for(const kk of Object.keys(o2)){const v=o2[kk];
    if(Array.isArray(v)&&v.length>8&&typeof v[0]==="number"){const md=ccMedian(v.filter(Number.isFinite))*(o.scale||1),dr=0.02*gauss();o2[kk]=v.map((x,i)=>md*(1+dr*i/v.length)*(1+0.004*gauss()));}else if(v&&typeof v==="object")jitter(v,d+1);}};
  if(E){jitter(E.mc,0);jitter(E.raw,0);}
  /* instrument log: new thermal trace (1 s, sample model), LED, timing distributions perturbed */
  if(E&&E.log){const tr=thermalTrace(r.protocol.programs,Object.assign({dt:1},o.thermal));
    const t0=o.date;
    E.log.temps=tr.seconds.map((s,i)=>[t0+s*1000,tr.temp[i],105+0.15*gauss(),o.heatsink+3*Math.sin(i/400)+0.3*gauss(),o.zone+0.1*Math.abs(gauss())]);
    E.log.leds=(E.log.leds||[]).map(l=>[l[0],o.led.temp+0.4*gauss(),o.led.current*(1+0.004*gauss()),l[3],o.led.junction+2*rnd()]);}
  if(E&&E.ccLog){const q0=E.ccLog,reg=a=>{if(!Array.isArray(a)||!a.length||typeof a[0]!=="number")return a;const md=ccMedian(a);return a.map(v=>Math.max(0,md+(v-md)*0.5+md*0.03*gauss()));};
    ["tick","pipe","roi"].forEach(kk=>{q0[kk]=reg(q0[kk]);});
    q0.cam=(q0.cam||[]).map(c=>({dur:c.req+420+60*Math.abs(gauss()),req:c.req}));
    const spQ=ccSetpoints(r);q0.imgTemp=(q0.imgTemp||[]).map(z=>{const s0=spQ.reduce((b,s)=>Math.abs(s-z[0])<Math.abs(b-z[0])?s:b,spQ[0]);return z.map(()=>s0+0.0005*gauss());});
    Object.keys(q0.exposure||{}).forEach(kk=>{const md=ccMedian(q0.exposure[kk]);q0.exposure[kk]=q0.exposure[kk].map(()=>md);});}
  if(E&&E.ccLog){const q=E.ccLog,f=o.slow||1;q.rt=q.rt.map(v=>v*f*(1+0.1*gauss()));q.wheel=q.wheel.map(v=>v*o.wheel*(1+0.02*gauss()));
    q.cover={down:o.cover[0]*(1+0.01*gauss()),up:o.cover[1]*(1+0.01*gauss())};q.errors=o.errors||0;
    if(q.props){q.props.lifeCycleCount=String(o.cycles);q.props.lifeDegreesClimbed=String(Math.round(o.cycles*31.2));}}
  r.cc=r.cc||{};r.cc.qs=E&&E.ccLog||null;r.cc.sat=E&&E.ccSat||null;r.cc.calib=E&&E.ccCalib||null;r.cc.mfTime=E&&E.ccMf||NaN;
  if(E&&E.log&&E.log.temps.length){const tt=E.log.temps.map(x=>x[0]/1000),yy=E.log.temps.map(x=>x[1]);
    r.cc.thermal=ccThermalSummary(ccThermalSteps(tt,yy,ccSetpoints(r),0.6,3),ccPeakRates(tt,yy,2.5));
    const tr2=ccTransitions(tt,yy,ccTransitionPairs(r),0.6);if(tr2)r.cc.thermal.transition=tr2;}
  r.ccStatic=null;r.synthetic=true;
  return r;
}
window.DEMO={lcRun,qsRun,thermalTrace,rnd,gauss,setSeed:s=>{SEED=s;}};
})();
