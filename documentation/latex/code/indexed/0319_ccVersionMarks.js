function ccVersionMarks(res){
  const out=[];let prev=null;
  res.pts.forEach(p=>{if(!p.row)return;const v=`${p.row.firmware||""}|${p.row.software||""}`;if(prev!==null&&v!==prev)out.push({x:p.x,label:"version change",colour:"#7c3aed",dash:"2 3"});prev=v;});
  return out;
}
