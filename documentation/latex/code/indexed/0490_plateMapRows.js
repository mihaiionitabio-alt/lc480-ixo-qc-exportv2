function plateMapRows(run,key){
  if(!run)return [];
  const wells=selectedWells(run,key),byPos=byKey(wells,w=>w.pos);
  const total=(run.rows||8)*(run.cols||12),rows=[];
  for(let pos=0;pos<total;pos++){
    const rec=(run.plate||{})[pos]||{},res=byPos.get(pos)||[];
    const cq=res.map(w=>Number(w.CpRaw)).filter(q=>Number.isFinite(q)&&q>0);
    const roles=uniq(res.map(w=>w.role).filter(Boolean));
    const types=uniq(res.map(w=>w.instrType).filter(Boolean));
    const cqRows=res.filter(w=>Number.isFinite(Number(w.CpRaw))&&Number(w.CpRaw)>0);
    rows.push({
      experiment:runName(run),source_uid:sourceUidOf(run),source_crc32:sourceCRCOf(run),
      well:posToWell(pos,run.cols),well_lims:posToLimsWell(pos,run.cols),position:pos+1,
      sample:rec.name||res[0]?.sample||"",sample_id:rec.sampleId||res[0]?.sampleId||"",
      subsets:uniq([...(rec.subsets||[]),...res.flatMap(w=>w.subsetsOfWell||[])]).join(" | "),
      instrument_type:types.join(" | "),role:roles.join(" | "),
      replicate_of:Number.isFinite(rec.replicateOf)?rec.replicateOf+1:"",
      target:uniq(res.map(w=>w.target).filter(Boolean)).join(" | "),
      analysis:uniq(res.map(w=>w.analysis).filter(Boolean)).join(" | "),
      cq:cq.length===1?cq[0]:"",
      cq_mean:cq.length>1?mean(cq):"",cq_n:cq.length,
      cq_by_analysis:cqRows.map(w=>`${w.analysis||"analysis"}=${w.CpRaw}`).join(" | "),
      call:uniq(res.map(w=>w.call).filter(Boolean)).join(" | "),
      results:res.length,named_unanalysed:(rec.name&&!res.length)?"yes":""
    });
  }
  return rows;
}
