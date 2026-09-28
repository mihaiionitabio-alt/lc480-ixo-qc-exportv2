function efficiencyFromSlope(slope){
  if(!Number.isFinite(slope)||slope>=-1e-6)return null;
  const e=Math.pow(10,-1/slope);
  return (e>1&&e<=3)?e:null;
}
