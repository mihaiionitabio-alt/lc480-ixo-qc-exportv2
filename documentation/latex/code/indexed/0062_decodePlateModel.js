function decodePlateModel(dom){
  const plate={};                       /* pos -> record */
  const get=pos=>plate[pos]??=(plate[pos]={pos,name:"",sampleId:"",notes:"",replicateOf:null,subsets:[],channels:{}});
  const chan=(pos,idx)=>{const r=get(pos);return r.channels[idx]??=(r.channels[idx]={});};
  const posOf=el=>{const t=pv(el,"Position");if(t==="")return null;const n=parseInt(t,10);return Number.isFinite(n)?n:null;};
  const chanOf=el=>{const c=el.querySelector('obj[name="ChannelProp"] > prop[name="ChannelIdx"]');return c?parseInt(c.textContent,10):null;};

  dom.querySelectorAll('[class="GenSampleEditName"]').forEach(el=>{
    const p=posOf(el);if(p==null)return;const v=pv(el,"name");if(v&&!get(p).name)get(p).name=v;
  });
  dom.querySelectorAll('[class="HTCSampleID"]').forEach(el=>{
    const p=posOf(el);if(p==null)return;const v=pv(el,"SampleID")||pv(el,"name");if(v)get(p).sampleId=v;
  });
  dom.querySelectorAll('[class="GenSampleEditNotes"],[class="HTCSamplePrepNotes"]').forEach(el=>{
    const p=posOf(el);if(p==null)return;const v=pv(el,"Notes")||pv(el,"name");if(v)get(p).notes=(get(p).notes?get(p).notes+" | ":"")+v;
  });
  dom.querySelectorAll('[class="GenSampleEditReplicate"]').forEach(el=>{
    const p=posOf(el);if(p==null)return;const v=pv(el,"ReplicateOf");if(v!=="")get(p).replicateOf=parseInt(v,10);
  });
  dom.querySelectorAll('[class="QuantSampleTypeProperty"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;chan(p,c).sampleType=pv(el,"SampleType");
  });
  dom.querySelectorAll('[class="QuantConcProperty"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;
    const v=pv(el,"Concentration");if(v!=="")chan(p,c).givenConc=Number(v);
  });
  dom.querySelectorAll('[class="QuantCpHighProp"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;const v=pv(el,"CpRangeHigh");if(v!=="")chan(p,c).cpHigh=Number(v);
  });
  dom.querySelectorAll('[class="QuantCpLowProp"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;const v=pv(el,"CpRangeLow");if(v!=="")chan(p,c).cpLow=Number(v);
  });
  dom.querySelectorAll('[class="RQEffProp"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;const v=pv(el,"Efficiency");if(v!=="")chan(p,c).rqEfficiency=Number(v);
  });
  dom.querySelectorAll('[class="TargetName"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;const v=pv(el,"name");if(v)chan(p,c).targetName=v;
  });
  dom.querySelectorAll('[class="RQTargetProperty"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;const v=pv(el,"TargetType");if(v)chan(p,c).targetType=v;
  });
  dom.querySelectorAll('[class="DominantChannelProp"]').forEach(el=>{
    const p=posOf(el);if(p==null)return;const v=pv(el,"DominantChannel");if(v!=="")get(p).dominantChannel=Number(v);
  });
  dom.querySelectorAll('[class="GroupingSample"]').forEach(el=>{
    const p=posOf(el);if(p==null)return;const v=pv(el,"GroupSampleType");if(v)get(p).endpointType=v;
  });
  dom.querySelectorAll('[class="Genotype"]').forEach(el=>{
    const p=posOf(el);if(p==null)return;const v=pv(el,"Genotype")||pv(el,"name");if(v)get(p).endpointGenotype=v;
  });
  dom.querySelectorAll('[class="ChannelGenotype"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;
    const kind=pv(el,"PropertyTypeName")||"Genotype",v=pv(el,"Genotype")||pv(el,"name")||pv(el,"GenotypeName");
    if(v){(chan(p,c).genotypes??={})[kind]=v;}
  });
  dom.querySelectorAll('[class="GroupChannelTypeProp"]').forEach(el=>{
    const p=posOf(el),c=chanOf(el);if(p==null||c==null)return;
    const kind=pv(el,"PropertyTypeName")||"Sample type",v=pv(el,"GroupSampleType");
    if(v){(chan(p,c).groupTypes??={})[kind]=v;}
  });
  return plate;
}
