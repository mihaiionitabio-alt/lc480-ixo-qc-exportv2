function tmRows(){
  return RUNS.flatMap(run=>(run.tmWells||[]).flatMap(t=>{
    const head={
      experiment:run.meta.name||run.file,source_uid:sourceUidOf(run),source_crc32:sourceCRCOf(run),
      well:t.well,well_lims:posToLimsWell(t.pos,run.cols),position:t.pos+1,
      sample:t.sample||"",analysis:t.analysis||"",
      channel:t.filterComb||t.filterName||"",channel_index:t.channel??"",
      melt_program:t.meltProgram||"",melt_program_index:t.meltProgramIndex??"",
      melt_segment:t.meltSegment??"",melt_curve_ambiguous:t.meltCurveAmbiguous?"yes":"",
      peaks_found:t.nPeaks||0,
      call_code:Number.isFinite(t.callCode)?t.callCode:"",
      peak_state:(t.nPeaks||0)>0?"peak detected":"no peak",
      manual_tms:String(t.manualTms??t.manual??"")==="1"?"yes":""
    };
    const n=t.nPeaks||0;
    if(!n)return [{...head,peak_index:"",peak:"",area:"",width:"",height:"",shoulder:""}];
    return Array.from({length:n},(_,i)=>({
      ...head,peak_index:i+1,
      peak:t.tms?.[i]??"",area:t.areas?.[i]??"",width:t.widths?.[i]??"",
      height:t.heights?.[i]??"",shoulder:(t.shoulders||[]).includes(i)?"yes":""
    }));
  }));
}
