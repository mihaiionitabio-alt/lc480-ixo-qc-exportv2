function renderReviewComparison(){
  const box=$("#review-compare"),a=$("#cmp-a"),b=$("#cmp-b");if(!box)return;
  const samples=uniq(RUNS.flatMap(r=>(r.wells||[]).map(w=>w.sample).filter(Boolean))).sort();
  if(!samples.length){setSelectItems(a,[],null);setSelectItems(b,[],null);box.innerHTML=emptyReview("No named quantification samples are loaded.");return;}
  const oldA=a.value,oldB=b.value;
  setSelectItems(a,samples.map(x=>({value:x,label:x})),oldA);
  const distinct=samples.find(x=>x.toLowerCase()!==String(a.value).toLowerCase())||samples[1]||samples[0];
  setSelectItems(b,samples.map(x=>({value:x,label:x})),oldB||distinct);
  const limit=Math.max(0,Number($("#cmp-limit").value)||0),rows=sampleComparisonRows(a.value,b.value,limit);
  REVIEW_STATE.comparison=rows;
  const display=rows.map(r=>({...r,mean_1:num(r.mean_1,3),sd_1:num(r.sd_1,3),mean_2:num(r.mean_2,3),
    sd_2:num(r.sd_2,3),difference:num(r.difference,3),
    review:r.review?tag("warn",r.review):tag("ok","within highlight threshold")}));
  box.innerHTML=table([
    {key:"target",label:"Target"},{key:"analysis",label:"Analysis"},
    {key:"mean_1",label:`${a.value} mean`,n:1},{key:"sd_1",label:`${a.value} SD`,n:1},
    {key:"n_1",label:`${a.value} n`,n:1},{key:"mean_2",label:`${b.value} mean`,n:1},
    {key:"sd_2",label:`${b.value} SD`,n:1},{key:"n_2",label:`${b.value} n`,n:1},
    {key:"difference",label:"Difference",n:1},{key:"review",label:"Review",html:1}
  ],display);
}
