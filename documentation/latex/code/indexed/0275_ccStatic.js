function ccStatic(run){
  const m={},meta=run.meta||{};
  const set=(k,v)=>{if(v!==undefined&&v!==null&&!(typeof v==="number"&&!Number.isFinite(v)))m[k]=v;};
  const variant=(k,obj)=>{const o={};for(const [a,b] of Object.entries(obj))if(Number.isFinite(b))o[a]=b;if(Object.keys(o).length)m[k]=o;};
  const T=runTimes(run);
  set("run_minutes",T.durationMin);set("edit_delay",Number.isFinite(T.editDelayH)?Math.log10(Math.max(T.editDelayH,0.01)):NaN);
  /* background and plateau per detection channel (A-H3) */
  const bg={},pl={},by=byKey((run.wells||[]).filter(w=>w.curve&&w.curve.length),w=>w.filterComb||w.target||String(w.channel));
  by.forEach((ws,ch)=>{const seen=new Set(),sig=ws.filter(w=>!seen.has(w.pos)&&seen.add(w.pos)).map(w=>wellSignal(w.curve));
    bg[ch]=ccMedian(sig.map(s=>s.background));pl[ch]=ccMedian(sig.map(s=>s.end));});
  variant("bg_median",bg);variant("plateau_median",pl);
  const x=run.cc||{};
  if(x.thermal)for(const [k,v] of Object.entries(x.thermal))set(k,v);
  if(run.platform!=="QuantStudio"){           /* ---------- LightCycler ---------- */
    const acq=x.acq||[];
    if(acq.length){
      const chans=uniq(acq.map(a=>a.channel)),sp=ccSetpoints(run);
      const acqSp=sp.length?sp.reduce((b,s)=>Math.abs(s-ccMedian(acq.map(a=>a.temp)))<Math.abs(b-ccMedian(acq.map(a=>a.temp)))?s:b,sp[0]):ccMedian(acq.map(a=>a.temp));
      const off=acq.filter(a=>a.channel===chans[0]).map(a=>a.temp-acqSp);
      set("hold_temp",{mean:mean(off),sd:sd(off),n:off.length});
      /* key channels by their filter pair (e.g. 465-510), not by the detection-format name,
         which differs between formats for the same optics (FAM vs 465-510) */
      const chName=c=>{const w=(run.wells||[]).find(x=>x.channel===c&&x.filterComb);if(w)return w.filterComb;
        const ch=(((run.protocol||{}).channels)||[]).filter(q=>q.active)[c];return ch?(ch.ex&&ch.em?`${ch.ex}-${ch.em}`:ch.name):"channel "+c;};
      const ref={},drift={},intg={};
      chans.forEach(c=>{const a=acq.filter(r=>r.channel===c);ref[chName(c)]=a[0].ref;
        drift[chName(c)]=100*(a[a.length-1].ref/a[0].ref-1);intg[chName(c)]=ccMedian(a.map(r=>r.intgr));});
      variant("lamp_ref",ref);variant("lamp_drift",drift);variant("exposure",intg);
      const over=[];for(let k=0;k+1<acq.length;k++)if(acq[k+1].channel===acq[k].channel+1)over.push(acq[k+1].ms-acq[k].ms-acq[k].intgr);
      set("chan_switch",ccMedian(over));
      const per=[];for(let k=0;k+chans.length<acq.length;k+=chans.length)per.push(acq[k+chans.length].ms-acq[k].ms);
      set("cycle_sd",sd(per));
      m.invalid_acq={bad:acq.filter(a=>!a.valid).length,n:acq.length};
    }
    if(x.templogLate)m.templog_late=x.templogLate;
  }else{                                        /* ---------- QuantStudio ---------- */
    const E=run.eds,L=E&&E.log,g=x.qs;
    if(L&&L.leds.length){set("led_current",ccMedian(L.leds.map(r=>r[2])));set("led_junction",Math.max(...L.leds.map(r=>r[4]).filter(Number.isFinite)));}
    if(L&&L.temps.length){set("zone_spread",ccQ(L.temps.map(r=>r[4]),0.95));set("cover_temp",ccMedian(L.temps.map(r=>r[2])));
      set("heatsink_max",Math.max(...L.temps.map(r=>r[3]).filter(Number.isFinite)));}
    if(g){
      const sp=ccSetpoints(run);
      if(g.imgTemp.length){const mz=g.imgTemp.map(z=>mean(z)),s0=sp.length?sp.reduce((b,s)=>Math.abs(s-ccMedian(mz))<Math.abs(b-ccMedian(mz))?s:b,sp[0]):ccMedian(mz);
        const off=mz.map(v=>v-s0);set("hold_temp",{mean:mean(off),sd:sd(off),n:off.length});}
      const ex={};for(const [f,a] of Object.entries(g.exposure))ex[f]=ccMedian(a);variant("exposure",ex);
      set("wheel_ms",ccMedian(g.wheel));m.wheel_slow={bad:g.wheel.filter(v=>v>500).length,n:g.wheel.length};
      if(g.enc.length)variant("encoder",{emission:ccMedian(g.enc.map(e=>e[0])),excitation:ccMedian(g.enc.map(e=>e[1]))});
      const co=g.cam.filter(c=>c.req!=null).map(c=>c.dur-c.req);if(co.length)set("cam_overhead",{mean:mean(co),sd:sd(co),n:co.length});
      set("cover_down",g.cover.down);set("cover_up",g.cover.up);
      set("cmd_rt",ccQ(g.rt,0.95));set("tick_late",ccQ(g.tick,0.95));
      const hours=(g.last-g.first)/3600;if(hours>0)m.catch_up={count:g.catchUp,exposure:hours};
      set("img_proc",ccQ(g.pipe,0.95));set("roi_ms",ccMedian(g.roi));
      if(g.predicted)set("runtime_err",100*(g.elapsed-g.predicted)/g.predicted);
      m.log_errors={count:g.errors};
      const cs=Object.keys(g.cycleStart).map(Number).sort((a,b)=>a-b).map(c=>g.cycleStart[c]),per=cs.slice(1).map((v,i)=>(v-cs[i])*1000);
      set("cycle_sd",sd(per));
      if(g.props.lifeCycleCount)m.block_cycles=+g.props.lifeCycleCount;
      if(g.props.firmwareVersion)m.firmware=String(g.props.firmwareVersion);
      if(x.mfTime&&g.last)set("handoff_min",(x.mfTime-g.last*1000)/60000);
    }
    if(x.sat)m.saturation=x.sat;
    if(x.calib)for(const [k,v] of Object.entries(x.calib))set(k,v);
    const wc=(run.wells||[]).filter(w=>w.eds&&w.eds.ctRecalc!=null&&Number.isFinite(Number(w.CpRaw))&&Number(w.CpRaw)>0);
    if(wc.length)m.ct_mismatch={bad:wc.filter(w=>Math.abs(Number(w.CpRaw)-w.eds.ctRecalc)>0.2).length,n:wc.length};
  }
  return m;
}
