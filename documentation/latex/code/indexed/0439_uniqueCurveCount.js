function uniqueCurveCount(run){
  return new Set(((run&&run.wells)||[]).filter(w=>w.curve).map(w=>`${w.channel}|${w.pos}`)).size;
}
