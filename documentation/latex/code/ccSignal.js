const CC_LIMIT_FLAG=/beyond 3σ|beyond limit|specification|^1-3s$|off the trend|CUSUM|EWMA|above [puc] limit|mean beyond|spread \(S\)|99\.8/;
function ccSignal(p){const f=(p&&p.flags)||[];if(!f.length)return "";return f.some(x=>CC_LIMIT_FLAG.test(x))?"limit":"rule";}
