function orphanCurveCandidates(run){
  if(!run||!run.allCurves||!Object.keys(run.allCurves).length)return [];
  /* Scope by the RUN, not by the channel. Excluding channels that no Cq analysis reads
     would re-create the blind spot of 23 September: in the three-channel COVID assay the
     channel with no analysis at all is precisely the one worth seeing, and a contamination
     finding lives there. So: skip a run that computes no crossing anywhere, and inside a
     run that does, keep looking at every channel. */
  if(!quantChannels(run).size)return [];
  if(typeof runProcessingState==="function"&&runProcessingState(run).state==="raw")return [];
  const results=[...(run.wells||[]),...(run.tmWells||[]),...(run.genoResults||[]),
    ...(run.otherResults||[])];
  /* answered: this channel and position carry a real answer (a Cq, or a reported
     no-crossing). unanswered: a row exists but says nothing, which is itself a finding. */
  const answered=new Set(),unanswered=new Map();
  results.filter(w=>Number.isFinite(Number(w.channel))&&Number.isFinite(Number(w.pos))).forEach(w=>{
    const k=`${Number(w.channel)}|${Number(w.pos)}`,a=resultAnswers(w);
    if(a)answered.add(k);else if(!unanswered.has(k))unanswered.set(k,w);
  });
  const claimed=answered;
  /* Use analysed Cq-bearing curves as the reference population.  Empty-well
     baseline wander must not lower the reference and then qualify itself as a
     signal.  If a channel has no result rows (a common vendor export shape),
     use the finite-Cq reference from the other active channels and report that
     the channel was not analysed. */
  const swingsByChannel=new Map(),finiteByChannel=new Map(),allAmps=[];
  (run.wells||[]).filter(w=>w.curve&&Number.isFinite(Number(w.channel))).forEach(w=>{
    const amp=Math.max(...w.curve)-Math.min(...w.curve);
    if(Number.isFinite(amp)&&amp>0){
      const ch=Number(w.channel);allAmps.push(amp);
      if(!swingsByChannel.has(ch))swingsByChannel.set(ch,[]);swingsByChannel.get(ch).push(amp);
      if(resultCq(w)!==null){if(!finiteByChannel.has(ch))finiteByChannel.set(ch,[]);finiteByChannel.get(ch).push(amp);}
    }
  });
  const refByChannel=new Map([...finiteByChannel].map(([ch,a])=>[ch,median(a.sort((x,y)=>x-y))]));
  const allFinite=[...finiteByChannel.values()].flat();
  const sortedAmps=allAmps.slice().sort((a,b)=>a-b);
  const globalRef=allFinite.length?median(allFinite.slice().sort((a,b)=>a-b)):(sortedAmps.length?sortedAmps[Math.floor(.75*(sortedAmps.length-1))]:NaN);
  const ampMed=sortedAmps.length?median(sortedAmps):0;
  const ampMad=sortedAmps.length?median(sortedAmps.map(x=>Math.abs(x-ampMed)).sort((a,b)=>a-b)):0;
  const active=(((run.protocol||{}).channels)||[]).filter(c=>c.active);
  const out=[];
  Object.values(run.allCurves).forEach(e=>{
    if(!e||!Number.isFinite(Number(e.channel))||!Number.isFinite(Number(e.pos))||!e.curve)return;
    const channel=Number(e.channel),pos=Number(e.pos),key=`${channel}|${pos}`,ref=refByChannel.get(channel)||globalRef;
    const noiseFloor=Math.max(3,6*ampMad,Number.isFinite(ref)?ref*.02:0);
    const signalFloor=Math.max(noiseFloor,Number.isFinite(ref)?ref*.05:0);
    if(claimed.has(key)||!(Number.isFinite(e.amplitude)&&e.amplitude>=signalFloor))return;
    const k=Math.max(2,Math.floor(e.curve.length/5));
    const first=mean(e.curve.slice(0,k)),last=mean(e.curve.slice(-k));
    const diffs=e.curve.slice(1).map((v,i)=>Number(v)-Number(e.curve[i])).filter(Number.isFinite);
    const risingFraction=diffs.length?diffs.filter(d=>d>0).length/diffs.length:0;
    if(!(last-first>=.45*e.amplitude&&risingFraction>=.55))return;
    const rec=(run.plate||{})[pos]||{},chRec=(rec.channels||{})[channel]||{};
    const instrRole=TYPE_TO_ROLE[chRec.sampleType]||"",nameRole=roleFromName(rec.name||"");
    const refine=instrRole&&nameRole!=="Unknown"&&NEGATIVE_FAMILY.includes(instrRole)
      &&NEGATIVE_FAMILY.includes(nameRole)&&instrRole!==nameRole;
    const role=refine?nameRole:(instrRole&&instrRole!=="Unknown"?instrRole:nameRole);
    const chDef=active[channel]||(((run.protocol||{}).channels)||[])[channel]||{};
    /* Classify rather than merely flag. Every class below is a rising trace with
       no result IN ITS OWN CHANNEL; what differs is what the position declares. */
    const blank=orphanBlankRole(rec,chRec);
    const stale=unanswered.get(key);           /* a row with no Cq and no reported no-crossing */
    const others=orphanOtherChannels(run,pos,channel);
    const withCq=others.filter(o=>o.cq!==null);
    const chName=chDef.name||`channel ${channel}`;
    const cls=blank?"blank-with-signal":stale?"result-without-cq"
      :others.length?"channel-not-analysed":"position-not-analysed";
    const context=withCq.length
      ? `the same position has ${withCq.map(o=>`${o.name}${o.target?" "+o.target:""} Cq ${o.cq}`).join(", ")}, in other channel(s)`
      : others.length?"the same position has results in other channels, none with a Cq"
        :"no stored result of any kind at this position";
    out.push({experiment:runName(run),well:posToWell(pos,run.cols),pos,
      row:Math.floor(pos/run.cols),col:pos%run.cols,sample:rec.name||"",
      target:"No result in this channel",analysis:"Rising curve with no result in its channel",
      analysisUid:ORPHAN_CURVE_KEY,channel,filterName:chDef.name||"",
      filterComb:Number.isFinite(chDef.ex)?`${chDef.ex}-${chDef.em??""}`:"",
      instrType:chRec.sampleType||"",instrRole,role:role||"Unknown",call:"Not analysed",
      curve:e.curve,amplitude:e.amplitude,relative:Number.isFinite(ref)&&ref>0?e.amplitude/ref:null,
      referenceAmplitude:Number.isFinite(ref)?ref:null,noiseFloor,riseFraction:risingFraction,
      cls,severity:blank?"error":"review",blankRole:blank,
      sameChannelCq:null,otherCq:withCq.length?withCq[0].cq:null,
      otherCqs:withCq.map(o=>o.cq),
      otherChannels:others.map(o=>`${o.name}${o.target?" "+o.target:""}${o.cq!==null?" Cq "+o.cq:""}`).join("; "),
      context,
      resultRow:stale?(stale.target||stale.analysis||"stored row"):"",
      finding:blank
        ? `${blank} position carries a rising curve in ${chName} — read as contamination until explained`
        : stale
          ? `${chName} has a stored result row (${stale.target||stale.analysis||"no target named"}) with no Cq and no reported no-crossing, over a rising curve`
          : `${chName} has a rising curve that belongs to no analysis (${context})`});
  });
  return out.sort((a,b)=>a.channel-b.channel||a.pos-b.pos);
}
