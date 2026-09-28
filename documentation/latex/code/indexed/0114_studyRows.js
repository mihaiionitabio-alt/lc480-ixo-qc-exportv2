function studyRows(r){const out=[],seen=new Set();
  for(const x of r.results){if(!x.studyStat||x.studyStat[0]==="-1.0")continue;const k=x.sample+"|"+x.target;if(seen.has(k))continue;seen.add(k);
    const s=x.studyStat.map(num),q=(x.studyRq||[]).map(num);
    out.push({sample:x.sample,target:x.target,df:s[0],mean:s[1],median:s[2],sd:s[3],se:s[4],rq:q[1],rqMin:q[2],rqMax:q[3],ddct:q[4]})}
  return out}
