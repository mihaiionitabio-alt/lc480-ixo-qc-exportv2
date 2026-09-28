function makeRDMLXML(run){
  const chemistry=dyeChemistryOf(run);
  const results=[...(run.wells||[]).filter(w=>w.curve),...(run.tmWells||[]).filter(w=>w.meltCurve&&w.meltCurve.length)];
  const targets=uniq(results.map(w=>w.target||"target"));
  const samples=uniq(results.map(w=>w.sample||w.well));
  const roleOf={};results.forEach(w=>{roleOf[w.sample||w.well]=w.role;});
  const dyeOf=t=>rdmlId("dye",t);
  let x=`<?xml version="1.0" encoding="UTF-8"?>\n<rdml version="1.4" xmlns="http://www.rdml.org">\n`;
  x+=`<dateMade>${new Date().toISOString().replace(/\.\d+Z$/,"Z")}</dateMade>\n`;
  x+=`<id><publisher>ixo-qc-export</publisher><serialNumber>${xesc(sourceUidOf(run)||run.meta.name||run.file)}</serialNumber></id>\n`;
  x+=`<experimenter id="op"><firstName>${xesc(operatorOf(run)||"operator")}</firstName><lastName>-</lastName></experimenter>\n`;
  /* dyes first: the element order in RDML 1.4 is dye, sample, target, experiment */
  targets.forEach(t=>{
    x+=`<dye id="${xesc(dyeOf(t))}"><dyeChemistry>${chemistry}</dyeChemistry></dye>\n`;
  });
  samples.forEach(s=>{
    x+=`<sample id="${xesc(rdmlId("smp",s))}"><type>${rdmlSampleType(roleOf[s])}</type>`
      +`<doubleStranded>true</doubleStranded></sample>\n`;
  });
  targets.forEach(t=>{
    x+=`<target id="${xesc(rdmlId("tgt",t))}" type="toi"><dyeId id="${xesc(dyeOf(t))}"/></target>\n`;
  });
  x+=`<experiment id="${xesc(rdmlId("exp",run.meta.name||run.file))}">\n`;
  analysisGroups(results).forEach(group=>{
    x+=`<run id="${xesc(rdmlId("run",(run.meta.name||run.file)+"_"+group.key))}">\n`;
    x+=`<instrument>${xesc(run.meta.InstrumentName||"LightCycler 480")}</instrument>\n`;
    x+=`<pcrFormat><rows>${run.rows}</rows><columns>${run.cols}</columns>`
      +`<rowLabel>ABC</rowLabel><columnLabel>123</columnLabel></pcrFormat>\n`;
    group.wells.forEach(w=>{
      x+=`<react id="${w.pos+1}"><sample id="${xesc(rdmlId("smp",w.sample||w.well))}"/>`;
      x+=`<data><tar id="${xesc(rdmlId("tgt",w.target||"target"))}"/>`;
      if(Number.isFinite(w.CpRaw)&&w.CpRaw>0)x+=`<cq>${w.CpRaw}</cq>`;
      if(w.tms&&Number.isFinite(w.tms[0]))x+=`<meltTemp>${w.tms[0]}</meltTemp>`;
      if(w.curve)w.curve.forEach((v,i)=>{x+=`<adp><cyc>${i+1}</cyc><fluor>${v}</fluor></adp>`;});
      if(w.meltCurve)w.meltCurve.forEach(p=>{
        x+=`<mdp><tmp>${p.temp}</tmp><fluor>${p.fluor}</fluor></mdp>`;
      });
      x+=`</data></react>\n`;
    });
    x+=`</run>\n`;
  });
  x+=`</experiment>\n</rdml>\n`;
  return x;
}