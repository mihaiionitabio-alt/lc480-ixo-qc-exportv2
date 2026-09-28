function parseLog(t){
  const o={counts:{},errors:[],temps:[],leds:[],props:{},version:"",images:0,start:null,end:null,events:[]};
  for(const line of t.split(/\r?\n/)){
    const m=line.match(/^(\S+)\s+(\d{9,}\.\d+)\s?(.*)$/);if(!m)continue;
    const [,lvl,ts,rest]=m;const tt=+ts*1000;o.counts[lvl]=(o.counts[lvl]||0)+1;
    if(lvl==="Temperature"){const s=rest.match(/-sample=([\d.,\-]+)/),c=rest.match(/-cover=([\d.\-]+)/),h=rest.match(/-heatsink=([\d.\-]+)/);
      if(s){const v=s[1].split(",").map(Number);o.temps.push([tt,mean(v),c?+c[1]:null,h?+h[1]:null,Math.max(...v)-Math.min(...v)])}}
    else if(lvl==="LEDStatus"){const g=k=>{const x=rest.match(new RegExp(k+":([\\d.\\-]+)"));return x?+x[1]:null};o.leds.push([tt,g("Temperature"),g("Current"),g("Voltage"),g("JuncTemp")])}
    else if(lvl==="Image")o.images++;
    else if(lvl==="Run"){if(/^Starting/.test(rest)){o.start=tt;const nm=rest.match(/^Starting "([^"]*)"/);if(nm)o.runName=nm[1];}if(/^Ended|^Aborted|^Stopped/.test(rest))o.end=tt;
      if(/^(Starting|Ended|Aborted|Stopped|Stage|Setting sample)/.test(rest))o.events.push([tt,rest])}
    else if(lvl==="Info"){const v=rest.match(/^Instrument Version:\s*(.+)$/);if(v)o.version=v[1].trim();
      const p=rest.match(/^Instrument Properties:\s*(.+)$/);if(p)for(const kv of p[1].matchAll(/-(\w+)=(\S+)/g))o.props[kv[1]]=kv[2]}
    if(/^(Error|Warning|Fatal|Critical)$/i.test(lvl)||/\bERRor\b|\[\w*Error\]/.test(rest))o.errors.push([tt,lvl,rest.slice(0,300)]);
  }
  return o;
}