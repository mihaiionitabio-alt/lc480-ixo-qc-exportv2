async function decodeAcq(raw,protocol){
  const m=raw.match(/name="AcquisitionStore"[^>]*>([^<]+)</);
  if(!m)return {channels:null,melt:null,acquisitions:0,scalingFactors:[],error:"AcquisitionStore not found"};
  const innerBytes=await inflate(base64ToBytes(m[1].trim()),"deflate");
  const inner=new TextDecoder().decode(innerBytes),segments={};
  let program=null,segment=null,cycle=null,channel=null,temp=null,scalingFactor=null,nAcq=0;
  const re=/name="Program">(\d+)<\/prop>|name="Segment">(\d+)<\/prop>|name="Cycle">(\d+)<\/prop>|name="Temp">\$([0-9A-Fa-f]{16})<\/prop>|name="Channel">(\d+)<\/prop>|name="ScalingFactor">([^<]+)<\/prop>|name="FloPoints">([^<]+)</g;
  let mm;
  while((mm=re.exec(inner))){
    if(mm[1]!==undefined){program=Number(mm[1]);continue;}
    if(mm[2]!==undefined){segment=Number(mm[2]);continue;}
    if(mm[3]!==undefined){cycle=Number(mm[3])+1;channel=null;temp=null;scalingFactor=null;continue;}
    if(mm[4]!==undefined){temp=hexBEToDouble(mm[4]);continue;}
    if(mm[5]!==undefined){channel=Number(mm[5]);continue;}
    if(mm[6]!==undefined){scalingFactor=Number(mm[6]);continue;}
    else{
      if(program==null||segment==null||cycle==null||channel==null)
        throw new Error("AcquisitionStore ordering is invalid");
      const b=base64ToBytes(mm[7]),dv=new DataView(b.buffer,b.byteOffset,b.byteLength),a=new Float32Array(b.byteLength/4);
      for(let i=0;i<a.length;i++)a[i]=dv.getFloat32(i*4,true);
      const key=`${program}/${segment}`;
      const seg=segments[key]??=(segments[key]={
        program,segment,cycles:{},acquisitions:[],collisions:0,temps:[],scalingFactors:[]
      });
      const slot=seg.cycles[cycle]??=(seg.cycles[cycle]={});
      if(slot[channel])seg.collisions++;
      else slot[channel]=a;
      seg.acquisitions.push({cycle,channel,temp,scalingFactor,values:a});
      if(Number.isFinite(temp))seg.temps.push(temp);
      if(Number.isFinite(scalingFactor))seg.scalingFactors.push(scalingFactor);
      nAcq++;
    }
  }
  const list=Object.values(segments).map(s=>{
    const prog=(protocol&&protocol.programs||[])[s.program]||null;
    const protoSeg=prog&&prog.segments?s.program>=0&&prog.segments[s.segment]:null;
    return Object.assign(s,{
      distinctCycles:Object.keys(s.cycles).length,
      protocolProgram:prog,protocolSegment:protoSeg,
      acqMode:protoSeg?String(protoSeg.acqMode||""):"",
      tempSpan:s.temps.length?Math.max(...s.temps)-Math.min(...s.temps):0
    });
  });
  if(!list.length)return {channels:null,melt:null,acquisitions:0,scalingFactors:[],error:"AcquisitionStore contained no acquisitions"};

  /* The protocol's single-acquisition segment is authoritative. The cycle-series
     shape is the fallback for legacy files whose store numbering cannot be joined
     safely to the protocol. A continuous ramp is never allowed to overwrite it. */
  const ranked=list.filter(s=>s.distinctCycles>1).sort((a,b)=>{
    const score=s=>(s.acqMode==="1"?100000:0)
      +(s.protocolProgram&&/quant/i.test(s.protocolProgram.mode||"")?10000:0)
      +s.distinctCycles*100-s.tempSpan;
    return score(b)-score(a);
  });
  const amp=ranked[0]||null;
  if(amp&&amp.collisions)
    throw new Error(`AcquisitionStore collision in amplification segment ${amp.program}/${amp.segment}`);
  if(amp&&amp.protocolProgram&&/quant/i.test(amp.protocolProgram.mode||"")
      &&amp.protocolProgram.cycles>1&&amp.distinctCycles!==amp.protocolProgram.cycles)
    throw new Error(`AcquisitionStore cycle count ${amp.distinctCycles} does not match protocol ${amp.protocolProgram.cycles}`);

  const channels={};
  if(amp)Object.entries(amp.cycles).forEach(([cyc,byChan])=>{
    Object.entries(byChan).forEach(([ch,a])=>{(channels[ch]??={})[cyc]=a;});
  });

  const melt=list.filter(s=>s!==amp&&s.acquisitions.length>1
      &&(s.acqMode==="2"||s.collisions>0||s.tempSpan>2))
    .map(s=>({
      program:s.program,segment:s.segment,
      programName:s.protocolProgram?String(s.protocolProgram.name||""):"",
      analysisMode:s.protocolProgram?String(s.protocolProgram.mode||""):"",
      points:s.acquisitions.filter(p=>Number.isFinite(p.temp))
        .sort((a,b)=>a.temp-b.temp)
    })).filter(s=>s.points.length>1);
  const scalingFactors=uniq(list.flatMap(s=>s.scalingFactors));
  return {
    channels:Object.keys(channels).length?channels:null,
    melt:melt.length?melt:null,
    acquisitions:nAcq,scalingFactors,
    segments:list.map(s=>({
      program:s.program,segment:s.segment,distinctCycles:s.distinctCycles,
      acquisitions:s.acquisitions.length,collisions:s.collisions,
      acqMode:s.acqMode,tempSpan:s.tempSpan
    })),
    error:amp||melt.length?null:"AcquisitionStore contained no usable cycle series or melt ramp"
  };
}
