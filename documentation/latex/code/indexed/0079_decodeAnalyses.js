function decodeAnalyses(dom){
  const out=[];
  const seenEl=new Set();
  dom.querySelectorAll('obj[class]').forEach(an=>{
    const cls=an.getAttribute("class")||"";
    if(!ANALYSIS_CLASS_RE.test(cls))return;
    if(/^(AnalysisList|TAnalysisSampleList|AnalysisSamples)$/i.test(cls))return;
    if(!an.querySelector(':scope > prop[name="name"]'))return;
    if(seenEl.has(an))return;seenEl.add(an);
    const name=pv(an,"name");
    const {kind,label}=analysisKind(cls,name);
    const sc=ownQuery(an,'[class="StdCurve"]');
    const stats=ownQueryAll(an,'[class="QuantStat"]').map(s=>({
      sampleIds:pv(s,"SampleIDs"),count:Number(pv(s,"SampleCount")),master:pv(s,"SampleMaster"),
      cpAvg:Number(pv(s,"CpAverage")),cpSD:Number(pv(s,"CpDeviation")),
      concAvg:Number(pv(s,"ConcAverage")),concSD:Number(pv(s,"ConcDeviation")),method:pv(s,"StatMethod")
    }));
    const genotypeGroups=uniq(ownQueryAll(an,'[class="GenotypeGroup"]')
      .map(g=>pv(g,"name")).filter(Boolean));
    /* "Subordinate for Target 1\\465-510\\Samples+Calibrator" is the per-gene quantification a
       relative quantification analysis runs internally; the gene is the first path segment. */
    const subsetRaw=pv(an,"SubsetName");
    const subordinate=/^Subordinate for /i.test(name);
    const geneName=subsetRaw.indexOf("\\")>=0?subsetRaw.split("\\")[0].trim():"";
    const cr=ownQuery(an,'[class="ChannelRatio"]');
    const xwl=cr?pv(cr,"NumeratorXWL"):"",dwl=cr?pv(cr,"DenominatorXWL"):"";
    /* the settings that define how this analysis produced its crossing points */
    const numOr=(t,el)=>{const v=pv(el||an,t);return v===""?null:Number(v);};
    const settings={
      mode:pv(an,"Mode"),measuringMode:pv(an,"MeasuringMode"),
      firstCycle:numOr("FirstCycle"),lastCycle:numOr("LastCycle"),
      backgroundStart:numOr("BackgroundStart"),backgroundStop:numOr("BackgroundStop"),
      noiseband:numOr("Noiseband"),noisebandMethod:pv(an,"NoisebandMethod"),
      stdDevMultiplier:numOr("StdDevMultiplier"),numFitPoints:numOr("NumFitPoints"),
      threshold:numOr("Threshold"),thresholdMethod:pv(an,"ThresholdMethod"),
      selectedProgram:pv(an,"SelectedProgram"),colourCompensation:pv(an,"IsCCCEnabled")==="1"
    };
    const ewl=cr?pv(cr,"NumeratorEWL"):"",dewl=cr?pv(cr,"DenominatorEWL"):"";
    out.push({
      cls,kind,kindLabel:label,
      name,shortName:pv(an,"shortname"),uid:pv(an,"UID"),
      created:pv(an,"Created"),modified:pv(an,"LastModified"),
      createdBy:pv(an,"CreatedByName"),modifiedBy:pv(an,"LastModifiedByName"),
      calcState:calcStateLabel(pv(an,"CalcState")),rawCalcState:pv(an,"CalcState"),cccEnabled:pv(an,"IsCCCEnabled")==="1",
      cpMethod:cpMethodOf(name,cls),
      subordinate,geneName,
      notes:pv(an,"Notes"),
      relQuant:kind==="relquant"?decodeRelQuant(an):null,
      subsetName:geneName||subsetRaw,rawSubsetName:subsetRaw,
      numeratorXWL:xwl===""?null:parseInt(xwl,10),
      numeratorEWL:ewl===""?null:parseInt(ewl,10),
      denominatorXWL:(dwl===""||dwl==="0")?null:parseInt(dwl,10),
      denominatorEWL:(dewl===""||dewl==="0")?null:parseInt(dewl,10),
      maxPos:Number(pv(an,"MaxPosSamples"))||null,
      settings,
      genotypeGroups,
      stdCurve:sc?{method:pv(sc,"Method"),curveType:pv(sc,"CurveType"),state:pv(sc,"State"),
        extAnchor:pv(sc,"ExtStdRqAnchor"),
        source:pv(sc,"CurveType")==="ctExternal"?"external"
              :pv(sc,"CurveType")==="ctInternal"?"in-run"
              :pv(sc,"CurveType")==="ctEfficiency"?"assumed efficiency":pv(sc,"CurveType"),
        assumedEfficiency:pv(sc,"CurveType")==="ctEfficiency",
        standards:[...sc.querySelectorAll('[class="StdCrvSam"]')].map(x=>({
          name:pv(x,"name"),wellText:pv(x,"PosAsStr"),pos:Number(pv(x,"Position")),
          cq:Number(pv(x,"CrossingPoint")),conc:Number(pv(x,"Concentration")),
          call:pv(x,"Call"),targetName:pv(x,"TargetName")})),
        fitError:Number(pv(sc,"FitError")),efficiency:Number(pv(sc,"Efficiency")),
        slope:Number(pv(sc,"Slope")),yIntercept:Number(pv(sc,"YIntercept")),
        curveEff:Number(pv(sc,"CurveEff")),linkConc:pv(sc,"LinkConc"),
        nStandards:sc.querySelectorAll('obj[name="Standard Samples"] list > obj').length}:null,
      quantStats:stats,el:an
    });
  });
  /* an analysis nested inside another belongs to it: a relative quantification analysis owns
     one subordinate quantification per gene, and those must stay distinguishable */
  out.forEach(a=>{
    let p=a.el.parentElement,parent=null;
    while(p&&!parent){
      parent=out.find(x=>x!==a&&x.el===p)||null;
      p=p.parentElement;
    }
    a.parentName=parent?parent.name:"";
    a.parentUid=parent?parent.uid:"";
    a.parentKind=parent?parent.kind:"";
    if(a.subordinate&&a.parentName)a.shortName=a.parentName;
  });
  return out;
}
