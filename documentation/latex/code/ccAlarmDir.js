function ccAlarmDir(p,res){
  const f=(p.flags||[]).join(" ");
  if(res.type==="funnel"||["p","u","c"].includes(res.type))return "hi";
  if(/below specification|downward/.test(f))return "lo";
  if(/above specification|upward|spread/.test(f))return "hi";
  const v=p.raw!==undefined&&res.type!=="ewma"?p.raw:p.y;return Number.isFinite(p.cl)&&v<p.cl?"lo":"hi";
}