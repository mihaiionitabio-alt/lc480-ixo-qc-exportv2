function ccQsLog(text){
  const L=text.split(/\r?\n/),o={rt:[],cam:[],wheel:[],enc:[],tick:[],catchUp:0,roi:[],pipe:[],imgTemp:[],exposure:{},
    cover:{},errors:0,cycleStart:{},first:null,last:null,predicted:null,elapsed:null,props:{}};
  const sent=new Map();let cam=null,req=null,wheel=null,lastImg=null,lastTick=null,coverT={};
  for(const l of L){
    const mm=l.match(/^(\S+) (\d{9,}\.\d+)/);if(!mm)continue;
    const kind=mm[1],t=+mm[2];if(o.first===null)o.first=t;o.last=t;let m;
    if(kind==="Debug"){
      if((m=l.match(/ C: (.+)$/))){const s=m[1],key=/^\d+ /.test(s)?s.split(" ")[0]:s.trim();sent.set(key,t);}
      else if((m=l.match(/ S: (\w+) (.+)$/))){const rest=m[2].trim(),id=rest.split(" ")[0],key=sent.has(id)?id:sent.has(rest)?rest:null;
        if(key!==null){o.rt.push((t-sent.get(key))*1000);sent.delete(key);}}
      else if((m=l.match(/Start XML:IMAGe\+ .*'exposure': '(\d+)'.*'sampleTemperature': '([\d.,]+)'/))){req=+m[1];
        o.imgTemp.push(m[2].split(",").map(Number));}
      else if(l.includes("CAMera:ACQuire start exposure"))cam=t;
      else if(l.includes("CAMera:ACQuire end exposure")&&cam!==null){o.cam.push({dur:(t-cam)*1000,req});cam=null;req=null;}
      else if((m=l.match(/Cover (Lowering|Lowered|Raising|Raised)/)))coverT[m[1]]=t;
    }else if(kind==="Info"){
      if(/ Motor start/.test(l))wheel=t;
      else if(/ Motor end/.test(l)&&wheel!==null){o.wheel.push((t-wheel)*1000);wheel=null;}
      else if((m=l.match(/Emission Encoder (-?\d+) \d+ Excitation Encoder (-?\d+)/)))o.enc.push([+m[1],+m[2]]);
      else if(/Error in command/.test(l))o.errors++;
      else if((m=l.match(/(TBC|Instrument) Properties:\s*(.+)$/)))for(const kv of m[2].matchAll(/-(\w+)=(\S+)/g))o.props[kv[1]]=kv[2];
      else if((m=l.match(/Memory Properties:\s+(\d+)/)))o.props.memory_kB=+m[1];
    }else if(kind==="Time"){
      if(lastTick!==null)o.tick.push(Math.abs((t-lastTick-1)*1000));lastTick=t;
      const r=l.match(/-elapsed=(\d+).*-remaining=(\d+)/);
      if(r){if(o.predicted===null)o.predicted=+r[1]+ +r[2];o.elapsed=+r[1];}
    }else if(kind==="Image"){
      lastImg=t;const e=+(l.match(/-exposure=(\d+)/)||[])[1],f=(l.match(/-excitation=(\w+)/)||[])[1]+"-"+(l.match(/-emission=(\w+)/)||[])[1],
        c=+(l.match(/-cycle=(\d+)/)||[])[1];
      const last=o.cam[o.cam.length-1];if(last&&last.req==null&&Number.isFinite(e))last.req=e;
      (o.exposure[f]=o.exposure[f]||[]).push(e);
      if(Number.isFinite(c)&&!(c in o.cycleStart))o.cycleStart[c]=t;
    }else if(kind==="Preprocessing"&&lastImg!==null)o.pipe.push((t-lastImg)*1000);
    else if(kind==="Scheduler"&&l.includes("Catching up"))o.catchUp++;
    if((m=l.match(/ROI Quantitation done in ([\d.]+) seconds/)))o.roi.push(+m[1]*1000);
  }
  if(coverT.Lowering&&coverT.Lowered)o.cover.down=coverT.Lowered-coverT.Lowering;
  if(coverT.Raising&&coverT.Raised)o.cover.up=coverT.Raised-coverT.Raising;
  return o;
}