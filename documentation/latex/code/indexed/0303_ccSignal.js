function ccSignal(p){const f=(p&&p.flags)||[];if(!f.length)return "";return f.some(x=>CC_LIMIT_FLAG.test(x))?"limit":"rule";}
