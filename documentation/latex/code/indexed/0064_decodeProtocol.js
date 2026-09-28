function decodeProtocol(dom){
  const programs=[];
  dom.querySelectorAll('[class="HTCRunProgram"]').forEach(el=>{
    const segs=[...el.querySelectorAll('[class="HTCRunSegment"]')].map(s=>({
      target:Number(pv(s,"Target")),target2:Number(pv(s,"Target2")),hold:Number(pv(s,"Hold")),
      slope:Number(pv(s,"Slope")),acqMode:pv(s,"AcquisitionMode"),acqPerDeg:pv(s,"AcqPerDegree"),
      stepSize:Number(pv(s,"StepSize")),stepDelay:Number(pv(s,"StepDelay"))
    }));
    programs.push({name:pv(el,"name"),cycles:Number(pv(el,"Cycles")),mode:pv(el,"AnalysisMode"),segments:segs});
  });
  const channels=[],seen=new Set();
  dom.querySelectorAll('[class="HTCChannel"]').forEach(el=>{
    const c={name:pv(el,"name"),active:pv(el,"Active")==="1",em:Number(pv(el,"EmissionWL")),ex:Number(pv(el,"ExcitationWL")),
      integr:Number(pv(el,"IntgrTime")),maxIntegr:Number(pv(el,"MaxIntgrTime")),
      meltFactor:pv(el,"MeltFactor"),quantFactor:pv(el,"QuantFactor")};
    const k=c.name+"|"+c.ex+"|"+c.em;if(seen.has(k))return;seen.add(k);channels.push(c);
  });
  const bt=dom.querySelector('[class="HTCBlockType"]');
  const block=bt?{
    id:pv(bt,"Id"),rowCount:Number(pv(bt,"RowCount")),colCount:Number(pv(bt,"ColCount")),
    rampUp:Number(pv(bt,"RampRateMaxUp")),rampDn:Number(pv(bt,"RampRateMaxDn")),
    volMin:Number(pv(bt,"ReactionVolMin")),volMax:Number(pv(bt,"ReactionVolMax")),
    volDefault:Number(pv(bt,"ReactionVolDefault"))
  }:null;
  const numOrNull=t=>{const v=propText(dom,t);return v===""?null:Number(v);};
  const setup={
    channelCount:numOrNull("ChannelCount"),subclass:propText(dom,"InstrumentSubclass"),
    seekTemp:numOrNull("SeekTemp"),maxPositions:numOrNull("MaxPositionsToSeek"),
    sampleVolume:numOrNull("SampleVolume"),plateId:propText(dom,"PlateID")
  };
  const detectionFormatName=propText(dom,"DefFormatName")||"";
  const analysisModes=[...dom.querySelectorAll('list[name="AnalysisModes"] prop, list[name="AnalysisModes"] item')]
    .map(e=>(e.textContent||"").trim()).filter(Boolean);
  return {programs,channels,block,setup,detectionFormatName,analysisModes:uniq(analysisModes),
    hasTemperatureLog:!!dom.querySelector('[class="TemperatureLog"]')};
}
