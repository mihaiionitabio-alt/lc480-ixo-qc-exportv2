function analysisResults(an,cols){
  const out=[];
  an.el.querySelectorAll('obj').forEach(o=>{
    if(NON_RESULT_CLASSES.test(o.getAttribute("class")||""))return;
    if(o.closest('[class="StdCurve"]'))return;
    if(!ownsResult(an,o))return;
    const posEl=o.querySelector(':scope > prop[name="Pos"]')||o.querySelector(':scope > prop[name="Position"]');
    if(!posEl)return;
    const d={};o.querySelectorAll(':scope > prop').forEach(pr=>d[pr.getAttribute("name")]=(pr.textContent||"").trim());
    if(!RESULT_PROPS.some(k=>k in d))return;
    const lists=readLists(o);
    const posTxt=d.Pos!==undefined?d.Pos:d.Position;
    let pos;
    if(/^[A-Za-z]/.test(posTxt))pos=wellToPos(posTxt,cols);
    else pos=parseInt(posTxt,10);
    if(!Number.isFinite(pos))return;
    out.push({pos,d,lists,kind:resultKindOf(d,lists)});
  });
  return out;
}
