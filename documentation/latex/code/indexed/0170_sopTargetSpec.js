function sopTargetSpec(w){
  const t=w.target||w.analysis||"";
  const spec=SOP.targets.find(s=>sopMatcher(s.match)(t))||{match:"*",kind:"auto",cqMax:40};
  let kind=spec.kind||"auto";
  if(kind==="auto")kind=(w.targetType==="dtReference"||w.role==="Reference"||/^(hmg|ic|ipc|ref)/i.test(t))?"reference":"target";
  return Object.assign({},spec,{kind});
}
