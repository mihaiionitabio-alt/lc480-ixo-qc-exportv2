function gCutLines(target,axis){
  const out=[];if(!target)return out;
  const spec=sopTargetSpec({target});
  if(SOP.graphs.showCutoffs&&Number.isFinite(sopNum(spec.cqMax)))out.push({[axis]:sopNum(spec.cqMax),label:`SOP cut-off ${spec.cqMax}`,colour:"#b91c1c"});
  if(SOP.graphs.showLate&&Number.isFinite(sopNum(spec.cqLate)))out.push({[axis]:sopNum(spec.cqLate),label:`late-signal ${spec.cqLate}`,colour:"#d97706",row:1});
  return out;
}
