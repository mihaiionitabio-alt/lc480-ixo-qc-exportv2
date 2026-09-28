function ccIxoTemperatureLog(text){
  const blk=(text.match(/name="TemperatureLog"[\s\S]*?<\/obj>/)||[""])[0];
  const t=(blk.match(/name="Times">([^<]+)</)||[])[1],v=(blk.match(/name="Temps">([^<]+)</)||[])[1];
  if(!t||!v)return null;
  const ms=ccDecodeArz(t),temp=ccDecodeArz(v),n=Math.min(ms.length,temp.length),sec=[],y=[];let bad=0;
  for(let k=0;k<n;k++){const tt=ms[k]/1000,yy=temp[k];                     // drop any point that is still implausible
    if(Number.isFinite(yy)&&yy>-50&&yy<200&&(!sec.length||tt>sec[sec.length-1])){sec.push(tt);y.push(yy);}else bad++;}
  return sec.length>10?{seconds:sec,temp:y,dropped:bad}:null;
}