function mgViewLoad(){
  const out=[];
  if(!RUNS.length&&!PASTED){
    const staged=Array.isArray(STAGED)&&STAGED.length;
    return [mgIt({kind:"intake",sev:"none",pict:MG_PICT.file,kindWord:"intake",code:"LOAD",
      title:staged?"Files staged, ready to read":"No experiment files are loaded",
      value:staged?String(STAGED.length):"0",unit:staged?"files staged":"files",
      state:staged?"The files passed intake. Read them to decode runs and build the views.":"Drop .ixo, .eds, .edt or .zip files on the load view to begin.",
      actions:staged
        ?[{key:"3",label:"Read staged files",cmd:"read files"},{key:"4",label:"Choose another selection",cmd:"choose files"}]
        :[{key:"3",label:"Choose experiment files",cmd:"choose files"}]})];
  }
  const meta=mgSafe(()=>metaRows(),[]);
  if(RUNS.length){
    const results=RUNS.reduce((a,r)=>a+((r.wells||[]).length),0);
    const curves=RUNS.reduce((a,r)=>a+mgSafe(()=>uniqueCurveCount(r),0),0);
    const tm=RUNS.reduce((a,r)=>a+((r.tmWells||[]).length),0);
    /* A file that could not be read, or whose container checksum does not match, is what
       raises this view. Without the test the view threw and the operator saw nothing. */
    const bad=RUNS.some(r=>r.acqError||(r.integrity&&r.integrity.ok===false));
    out.push(mgIt({kind:"summary",sev:bad?"alarm":"ok",pict:MG_PICT.summary,kindWord:"files read",code:"LOAD",
      title:"Files read into this session",value:String(RUNS.length),unit:RUNS.length===1?"file":"files",
      limits:`${results.toLocaleString()} stored results · ${curves.toLocaleString()} curves decoded`,
      state:"Decoded file metadata and stored results are ready. Open File integrity for any file-integrity mismatch.",
      evidence:uniq(RUNS.map(r=>r.platform||"LightCycler 480")).join(" · "),
      rows:[["Stored results",results.toLocaleString()],["Curves decoded",curves.toLocaleString()],
            ["Melting results",tm.toLocaleString()],
            ["Instruments",uniq(RUNS.map(r=>(r.meta&&r.meta.InstrumentName)||"not named")).join(", ")],
            ["Operators",uniq(meta.map(m=>m.operator).filter(Boolean)).join(", ")||"—"],
            ["Active profile",`${SOP.name} v${SOP.version}`]],
      actions:[{key:"3",label:"Choose experiment files",cmd:"choose files"}]}));
    RUNS.forEach((r,i)=>{
      const m=meta[i]||{},ok=true;
      out.push(mgIt({kind:"file",sev:r.acqError?"watch":"ok",pict:MG_PICT.file,kindWord:"file",
        code:"F"+(i+1),title:m.experiment||r.file||("Experiment "+(i+1)),
        value:String(m.quantification_results||0),unit:"stored results",
        limits:`${mgTxt(m.plate)} plate · ${mgTxt(m.cycles)} cycles · ${m.curves_decoded||0} curves`,
        state:r.acqError?("Fluorescence could not be read: "+r.acqError)
              :r.isTemplate?"Template or unrun experiment — plate setup, protocol and analysis settings only."
              :"File decoded; stored values are ready for review.",
        evidence:`${mgTxt(m.platform)} · ${m.instrument||"instrument not named"} · ${m.run_started||m.experiment_created||"no date"}`,
        rows:[["File",mgTxt(r.file)],["Instrument",mgTxt(m.instrument)],["Software",mgTxt(m.software_version)],
              ["Operator",mgTxt(m.operator)],["Run started",mgTxt(m.run_started)],["Run ended",mgTxt(m.run_ended)],
              ["Run minutes",mgTxt(m.run_duration_minutes)],["Channels",mgTxt(m.channels)],
              ["Analyses",String(m.analyses||0)],["Melting results",String(m.melting_results||0)],
              ["Bytes",m.source_bytes?Number(m.source_bytes).toLocaleString():"—"]],
        actions:[{key:"3",label:"Choose experiment files",cmd:"choose files"}]}));
    });
  }
  if(PASTED)out.push(mgIt({kind:"file",sev:"ok",pict:MG_PICT.file,kindWord:"pasted table",code:"CSV",
    title:"Pasted Cq table",value:String((PASTED.rows||[]).length),unit:"Cq values",
    limits:"no fluorescence curves in a pasted table",
    state:"Replicate checks and the inhibition test use these values; curve-based exports need an .ixo or .eds file.",
    evidence:PASTED.source||"pasted data"}));
  return out;
}
