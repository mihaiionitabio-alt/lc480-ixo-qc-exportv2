function runTimeline(run){
  const m=run.meta||{},ev=[],add=(what,t,source,kind)=>{const v=sopTime(t);if(Number.isFinite(v))ev.push({what,time:v,source,kind:kind||"file"});};
  add("Experiment created",m.Created,"experiment Created","file");
  add("Run created",m.RunCreated,"run Created","run");
  add("Run started",m.StartTime,"run StartTime","run");
  add("Run ended",m.EndTime,"run EndTime","run");
  add("Experiment last modified",m.LastModified,"experiment LastModified","edit");
  if(!run.eds)(run.analyses||[]).forEach(a=>{add(`Analysis created — ${a.name||a.shortName}`,a.created,"analysis Created","analysis");
    add(`Analysis modified — ${a.name||a.shortName}`,a.modified,"analysis LastModified","analysis");});
  if(run.eds){
    const E=run.eds;
    if(E.exp&&E.exp.modified)add("Experiment last modified",E.exp.modified,"experiment.xml ModifiedTime","edit");
    const zipDates=(E.entries||[]).map(e=>sopTime(e.date)).filter(Number.isFinite);
    if(zipDates.length){add("Container last saved (ZIP entry dates)",Math.max(...zipDates),"ZIP central directory — newest entry","edit");
      add("Oldest ZIP entry date",Math.min(...zipDates),"ZIP central directory — oldest entry","file");}
    if(E.log&&E.log.start)add("Instrument log start",E.log.start,"messages.log","run");
    if(E.log&&E.log.end)add("Instrument log end",E.log.end,"messages.log","run");
    (E.calibrations||[]).forEach(c=>{add(`Calibration performed — ${c.name}`,c.ts,c.file,"calibration");add(`Calibration expires — ${c.name}`,c.exp,c.file,"calibration");});
  }
  return ev.sort((a,b)=>a.time-b.time);
}