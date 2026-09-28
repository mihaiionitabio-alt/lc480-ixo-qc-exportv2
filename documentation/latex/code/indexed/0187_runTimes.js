function runTimes(run){
  const ev=runTimeline(run),pick=re=>ev.filter(e=>re.test(e.what)).map(e=>e.time);
  const start=pick(/^Run started$/)[0],end=pick(/^Run ended$/)[0];
  const edits=pick(/last modified|last saved|^Analysis modified/),created=pick(/^Experiment created$/)[0];
  const lastEdit=edits.length?Math.max(...edits):NaN;
  return {start,end,created,lastEdit,durationMin:Number.isFinite(start)&&Number.isFinite(end)?(end-start)/60000:NaN,
    editDelayH:Number.isFinite(lastEdit)&&Number.isFinite(end)?(lastEdit-end)/3600000:NaN};
}
