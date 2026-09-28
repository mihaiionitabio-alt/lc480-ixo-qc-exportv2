function gRunTicks(runs){
  if(runs.length<=40)return {xticks:runs.map((r,i)=>({v:i,label:runName(r).slice(0,16),rotate:-40,anchor:"end"})),bottom:120,xlab:""};
  const step=Math.ceil(runs.length/9),t=[];
  for(let i=0;i<runs.length;i+=step){const d=gRunDate(runs[i]);t.push({v:i,label:Number.isFinite(d)?sopFmtTime(d).slice(0,10):String(i+1),rotate:-30,anchor:"end"});}
  return {xticks:t,bottom:80,xlab:`${runs.length} runs in date order`};
}