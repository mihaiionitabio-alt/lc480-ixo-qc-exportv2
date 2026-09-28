function decodeRelQuant(an){
  const genes=[...an.querySelectorAll('[class="RelQuantData"]')].map(g=>{
    const gi=g.querySelector('[class="GeneInfo"]'),cr2=gi&&gi.querySelector('[class="ChannelRatio"]');
    return {
      name:gi?pv(gi,"RQTargetName"):"",
      type:gi?pv(gi,"RQDataType"):"",
      isTarget:(gi?pv(gi,"RQDataType"):"")==="dtTarget",
      external:gi?pv(gi,"ExternalData")==="1":false,
      ex:cr2?Number(pv(cr2,"NumeratorXWL")):null,em:cr2?Number(pv(cr2,"NumeratorEWL")):null,
      positions:[...g.querySelectorAll('[class="TIntegerList"] > list > prop')].map(x=>Number(x.textContent))
    };
  });
  const posList=el=>[...el.querySelectorAll('[class="PairSampleInfo"]')]
    .map(x=>({pos:Number(pv(x,"BasePosition")),gene:Number(pv(x,"RQDataIndex")),channel:Number(pv(x,"RQChannelIndex"))}));
  const pairings=[...an.querySelectorAll('[class="Pairing"]')].map(p=>({
    name:pv(p,"name"),
    calibTarget:posList(p.querySelector(':scope > obj[name="CalibTarget"]')||p),
    calibRef:posList(p.querySelector(':scope > obj[name="CalibRef"]')||p),
    pairTarget:posList(p.querySelector(':scope > obj[name="PairTarget"]')||p),
    pairRef:posList(p.querySelector(':scope > obj[name="PairRef"]')||p)
  }));
  const targets=genes.filter(g=>g.isTarget),refs=genes.filter(g=>!g.isTarget);
  const groups=[...an.querySelectorAll('[class="ResultGroup"]')].map((g,i)=>{
    const unknowns=[...g.querySelectorAll('[class="UnkResult"]')].map(x=>rqResult(x,false));
    /* which genes this group compared: read it from the pairings it names, and fall back
       to the declaration order of the target genes */
    const named=new Set(unknowns.map(u=>u.pairName));
    const mine=pairings.filter(p=>named.has(p.name));
    const gi=mine.length&&mine[0].pairTarget.length?mine[0].pairTarget[0].gene:null;
    const ri=mine.length?uniq(mine[0].pairRef.map(x=>x.gene)):[];
    return {
      hasCalib:pv(g,"HasCalib")==="1",
      target:(gi!=null&&genes[gi])?genes[gi].name:(targets[i]?targets[i].name:""),
      references:ri.length?ri.map(x=>genes[x]?genes[x].name:"").filter(Boolean):refs.map(x=>x.name),
      calib:rqResult(g.querySelector('[class="CalibResult"]'),true),
      unknowns
    };
  });
  return {
    genes,targets:targets.map(g=>g.name),references:refs.map(g=>g.name),pairings,groups,
    rule:PAIRING_RULES[pv(an,"PairingRule")]||pv(an,"PairingRule"),
    ruleCode:pv(an,"PairingRule"),
    manualPairing:pv(an,"ManualPairing")==="1",
    multiTarget:pv(an,"MultiTarget")==="1",
    correction:pv(an,"CorrectionFactor"),multiplication:pv(an,"MultiplicationFactor")
  };
}
