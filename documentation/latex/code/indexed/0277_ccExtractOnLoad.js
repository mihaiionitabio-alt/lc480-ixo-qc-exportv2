async function ccExtractOnLoad(run,source){
  const cc={};
  try{
    if(run.platform==="QuantStudio"){
      cc.qs=run.eds&&run.eds.ccLog||null;cc.sat=run.eds&&run.eds.ccSat||null;cc.calib=run.eds&&run.eds.ccCalib||null;cc.mfTime=run.eds&&run.eds.ccMf||NaN;
      const L=run.eds&&run.eds.log;
      if(L&&L.temps.length){const tt=L.temps.map(r=>r[0]/1000),yy=L.temps.map(r=>r[1]);
        cc.thermal=ccThermalSummary(ccThermalSteps(tt,yy,ccSetpoints(run),0.6,3),ccPeakRates(tt,yy,2.5));
        const tr=ccTransitions(tt,yy,ccTransitionPairs(run),0.6);if(tr)cc.thermal.transition=tr;}
    }else if(source&&source.text){
      cc.log=ccIxoTemperatureLog(source.text);
      if(cc.log){cc.thermal=ccThermalSummary(ccThermalSteps(cc.log.seconds,cc.log.temp,ccSetpoints(run)),ccPeakRates(cc.log.seconds,cc.log.temp,2));
        const tr=ccTransitions(cc.log.seconds,cc.log.temp,ccTransitionPairs(run),0.5);if(tr)cc.thermal.transition=tr;
        const dt=cc.log.seconds.slice(1).map((v,i)=>(v-cc.log.seconds[i])*1000);cc.templogLate={bad:dt.filter(d=>d>500).length,n:dt.length};
        cc.log=ccThin(cc.log.seconds,cc.log.temp,1800);}                   // light copy for the trace chart
      cc.acq=await ccIxoAcquisitions(source.text);
    }
  }catch(e){console.error("control-chart extraction",e);cc.error=e.message;}
  run.cc=cc;
}
