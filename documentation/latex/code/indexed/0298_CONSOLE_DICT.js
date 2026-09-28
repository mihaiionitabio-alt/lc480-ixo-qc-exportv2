const CONSOLE_DICT=Object.freeze({
  schema:"qpcr-console-dictionary/1",
  session:["phase","activeTab","generation","runs","wells","stagedFiles","stagedBytes","heapMB","historyRows","lastRenderMs","faults","notices","profileName","profileVersion","profileSha"],
  channels:Object.freeze(CC_CHARTS.map(d=>Object.freeze({code:d.code,id:d.id,name:d.title,unit:d.unit||"",group:d.group||"",type:d.type||"",instrumentFamilies:d.inst||[],limits:d.spec||null,lowMeaning:(CC_LIMIT_TEXT[d.id]||{}).lo||"",highMeaning:(CC_LIMIT_TEXT[d.id]||{}).hi||""})))
});
