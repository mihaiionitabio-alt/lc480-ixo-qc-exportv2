function ccFunnel(rows,metric){            // one point per operator
  const by=byKey(rows.filter(r=>r.m[metric]&&r.m[metric].n),r=>r.operator||"(not recorded)");
  const tot=[...by.values()].flat(),p0=tot.reduce((s,r)=>s+r.m[metric].bad,0)/(tot.reduce((s,r)=>s+r.m[metric].n,0)||1);
  return {p0,pts:[...by].map(([op,rs])=>{const b=rs.reduce((s,r)=>s+r.m[metric].bad,0),n=rs.reduce((s,r)=>s+r.m[metric].n,0),y=b/n;
    const u95=p0+1.96*Math.sqrt(p0*(1-p0)/n),u998=p0+3.09*Math.sqrt(p0*(1-p0)/n);
    return {operator:op,n,bad:b,y,u95,u998,flags:y>u998?["outside 99.8 %"]:y>u95?["outside 95 %"]:[]};})};
}