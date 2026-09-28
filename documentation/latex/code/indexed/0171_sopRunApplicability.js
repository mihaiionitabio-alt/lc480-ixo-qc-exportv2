function sopRunApplicability(run){
  const m=SOP&&SOP.method||{},a=m.applies_when||{};
  if(!Object.keys(a).length)return {applicable:true,reason:"method has no applicability restriction"};
  const name=runName(run);
  if(a.run_name_pattern){try{if(!(new RegExp(a.run_name_pattern,"i")).test(name))return {applicable:false,reason:`run name ${name} does not match this SC_ method`};}catch(e){return {applicable:false,reason:"method run-name pattern is invalid"};}}
  if(Array.isArray(a.platforms)&&a.platforms.length){const plat=String(run.platform||"");if(!a.platforms.some(x=>plat.toLowerCase().includes(String(x).toLowerCase())))return {applicable:false,reason:`platform ${plat||"unknown"} is outside this method`};}
  const names=uniq([...(run.wells||[]).map(w=>w.target||w.analysis||""),...(run.analyses||[]).map(x=>x.shortName||x.name||"")].filter(Boolean));
  if(Array.isArray(a.target_patterns)&&a.target_patterns.length&&!a.target_patterns.some(p=>names.some(n=>sopMatcher(p)(n))))return {applicable:false,reason:"required SC_ targets are not present in the decoded run"};
  const cycles=Number(run.amplificationCycles??run.nCycles??run.cycles);if(Number.isFinite(a.min_amplification_cycles)&&(!Number.isFinite(cycles)||cycles<a.min_amplification_cycles))return {applicable:false,reason:`amplification cycle count ${Number.isFinite(cycles)?cycles:"unknown"} is below the method minimum`};
  return {applicable:true,reason:"run matches SOP-06 SC screening scope"};
}
