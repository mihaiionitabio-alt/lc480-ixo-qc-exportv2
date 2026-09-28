function runDurationMinutes(run){
  const m=(run&&run.meta)||{},a=Date.parse(m.StartTime||""),b=Date.parse(m.EndTime||"");
  return Number.isFinite(a)&&Number.isFinite(b)&&b>=a?(b-a)/60000:"";
}
