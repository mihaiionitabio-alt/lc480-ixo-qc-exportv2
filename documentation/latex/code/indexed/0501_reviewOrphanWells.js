function reviewOrphanWells(){
  return RUNS.flatMap(run=>orphanCurveCandidates(run).map(o=>({
    experiment:o.experiment,well:o.well,sample:o.sample,role:o.role,channel:o.channel,
    filter:o.filterComb||o.filterName||"",classification:o.cls,level:o.severity,
    stored_row:o.resultRow||"",same_channel_cq:o.sameChannelCq==null?"":o.sameChannelCq,
    other_channel_cq:o.otherCq==null?"":o.otherCq,other_channels:o.otherChannels,
    amplitude:o.amplitude,relative:o.relative,finding:o.finding
  })));
}
