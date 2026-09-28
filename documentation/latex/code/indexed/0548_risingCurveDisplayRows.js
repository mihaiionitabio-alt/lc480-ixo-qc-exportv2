function risingCurveDisplayRows(rows){
  return rows.map(o=>({
    experiment:o.experiment,well:o.well,sample:o.sample||"",role:o.role||"Unknown",
    channel:o.filterName||`channel ${o.channel}`,target:o.target,
    cq_ct:o.sameChannelCq==null?"not stored":o.sameChannelCq,
    other_cq_ct:o.otherCq==null?"":o.otherCq,
    other_channels:o.otherChannels||"",classification:o.cls,severity:o.severity,
    amplitude:Number.isFinite(o.amplitude)?num(o.amplitude,3):"",
    relative:Number.isFinite(o.relative)?num(o.relative*100,0)+" %":"",
    finding:o.finding
  }));
}
