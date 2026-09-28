const EDS=(()=>{

/* ---------- small utilities ---------- */
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>{const x=parseFloat(v);return Number.isFinite(x)?x:null};
const fmt=(v,d=3)=>v==null||!Number.isFinite(v)?"":(Math.abs(v)>=1e6||(Math.abs(v)<1e-3&&v!==0)?v.toExponential(3):(+v.toFixed(d)).toString());
const pill=(cls,t)=>`<span class="pill ${cls}">${esc(t)}</span>`;
const dt=ms=>{if(!ms||!isFinite(ms)||ms<=0)return "";const d=new Date(ms);const p=n=>String(n).padStart(2,"0");const o=-d.getTimezoneOffset(),tz=`UTC${o>=0?"+":"−"}${Math.abs(o)/60}`;return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ${tz}`};
const hex=u8=>Array.from(u8,b=>b.toString(16).padStart(2,"0")).join("");
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const sd=a=>{if(a.length<2)return null;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))};
const ROWS="ABCDEFGHIJKLMNOP";
const wellPos=(i,cols)=>ROWS[Math.floor(i/cols)]+(i%cols+1);
function download(name,data,mime){
  const blob=data instanceof Blob?data:new Blob([data],{type:mime||"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
}
const safeName=s=>String(s||"experiment").replace(/[^\w.\-]+/g,"_").slice(0,80);

/* ---------- CRC-32 ---------- */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC_T[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}

/* ---------- MD5 (streaming, for the Tamper check) ---------- */
function MD5(){
  const K=new Uint32Array(64),S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
  for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*2**32)>>>0;
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  const buf=new Uint8Array(64);let bl=0,total=0;const M=new Uint32Array(16);
  function block(b,o){
    for(let i=0;i<16;i++)M[i]=b[o+i*4]|b[o+i*4+1]<<8|b[o+i*4+2]<<16|b[o+i*4+3]<<24;
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){
      let F,g;
      if(i<16){F=(B&C)|(~B&D);g=i}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}
      else if(i<48){F=B^C^D;g=(3*i+5)%16}else{F=C^(B|~D);g=(7*i)%16}
      const s=S[(i>>4)*4+(i&3)];
      F=(F+A+K[i]+M[g])|0;A=D;D=C;C=B;B=(B+((F<<s)|(F>>>(32-s))))|0;
    }
    a0=(a0+A)|0;b0=(b0+B)|0;c0=(c0+C)|0;d0=(d0+D)|0;
  }
  return{
    update(u8){let i=0;total+=u8.length;
      if(bl){while(bl<64&&i<u8.length)buf[bl++]=u8[i++];if(bl===64){block(buf,0);bl=0}}
      for(;i+64<=u8.length;i+=64)block(u8,i);
      while(i<u8.length)buf[bl++]=u8[i++];},
    digest(){const bits=total*8;const pad=new Uint8Array(((bl<56)?56-bl:120-bl)+8);pad[0]=0x80;
      const dv=new DataView(pad.buffer);dv.setUint32(pad.length-8,bits>>>0,true);dv.setUint32(pad.length-4,Math.floor(bits/2**32),true);
      this.update(pad);const out=new Uint8Array(16),dv2=new DataView(out.buffer);
      [a0,b0,c0,d0].forEach((w,k)=>dv2.setUint32(k*4,w>>>0,true));return hex(out)}
  };
}

/* ---------- ZIP reader (no dependencies) ---------- */
async function inflateRaw(u8){
  if(typeof DecompressionStream==="undefined")throw new Error("This browser lacks DecompressionStream; use a current Chrome, Edge, Firefox or Safari.");
  const ds=new DecompressionStream("deflate-raw");
  const out=await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(out);
}
async function readZip(buf){
  const u8=new Uint8Array(buf),dv=new DataView(buf);
  let e=-1;for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
  if(e<0)throw new Error("Not a ZIP container (no end-of-central-directory record). Is this really an .eds file?");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);
  const td=new TextDecoder();const entries=[];
  for(let k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50)throw new Error("Corrupt central directory");
    const method=dv.getUint16(p+10,true),mt=dv.getUint16(p+12,true),md=dv.getUint16(p+14,true),crc=dv.getUint32(p+16,true),
      csize=dv.getUint32(p+20,true),usize=dv.getUint32(p+24,true),fl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),
      cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const name=td.decode(u8.subarray(p+46,p+46+fl));
    const date=`${((md>>9)+1980)}-${String((md>>5)&15).padStart(2,"0")}-${String(md&31).padStart(2,"0")} ${String(mt>>11).padStart(2,"0")}:${String((mt>>5)&63).padStart(2,"0")}`;
    entries.push({name,method,crc,csize,usize,off,date,dir:name.endsWith("/")});
    p+=46+fl+xl+cl;
  }
  const cache=new Map();
  async function get(name){
    if(cache.has(name))return cache.get(name);
    const en=entries.find(x=>x.name===name);if(!en)return null;
    const o=en.off;if(dv.getUint32(o,true)!==0x04034b50)throw new Error("Bad local header: "+name);
    const s=o+30+dv.getUint16(o+26,true)+dv.getUint16(o+28,true);
    const raw=u8.subarray(s,s+en.csize);
    let data;if(en.method===0)data=raw;else if(en.method===8)data=await inflateRaw(raw);else throw new Error(`Unsupported compression ${en.method} in ${name}`);
    en.crcOk=crc32(data)===en.crc;cache.set(name,data);return data;
  }
  return{entries,get};
}

/* ---------- ZIP writer (stored, for .rdml) ---------- */
function makeZip(files){ // [{name, data:Uint8Array}]
  const enc=new TextEncoder();const parts=[];const cen=[];let off=0;
  for(const f of files){
    const nm=enc.encode(f.name),d=f.data,c=crc32(d);
    const h=new Uint8Array(30+nm.length),v=new DataView(h.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(8,0,true);v.setUint32(14,c,true);
    v.setUint32(18,d.length,true);v.setUint32(22,d.length,true);v.setUint16(26,nm.length,true);h.set(nm,30);
    parts.push(h,d);
    const ch=new Uint8Array(46+nm.length),cv=new DataView(ch.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint32(16,c,true);
    cv.setUint32(20,d.length,true);cv.setUint32(24,d.length,true);cv.setUint16(28,nm.length,true);cv.setUint32(42,off,true);ch.set(nm,46);
    cen.push(ch);off+=h.length+d.length;
  }
  const cs=cen.reduce((s,x)=>s+x.length,0);const end=new Uint8Array(22),ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,cs,true);ev.setUint32(16,off,true);
  return new Blob([...parts,...cen,end],{type:"application/zip"});
}

/* ---------- XML helpers ---------- */
const xml=u8=>{const d=new DOMParser().parseFromString(new TextDecoder().decode(u8),"application/xml");if(d.querySelector("parsererror"))throw new Error("XML parse error");return d};
const kid=(el,tag)=>el?Array.from(el.children).find(c=>c.tagName===tag):null;
const kids=(el,tag)=>el?Array.from(el.children).filter(c=>c.tagName===tag):[];
const txt=(el,tag)=>{const k=kid(el,tag);return k?k.textContent.trim():""};
const argb=v=>{const n=parseInt(v,10);if(!Number.isFinite(n))return null;const u=n>>>0;return `rgb(${(u>>16)&255},${(u>>8)&255},${u&255})`};
const bracketList=s=>String(s||"").replace(/^\s*\[|\]\s*$/g,"").split(",").map(x=>x.trim()).filter(Boolean);
function ini(text){const o={};let sec="";for(const line of text.split(/\r?\n/)){const l=line.trim();if(!l||l.startsWith("#"))continue;
  const m=l.match(/^\[(.+)\]$/);if(m){sec=m[1];o[sec]=o[sec]||{};continue}
  const kv=l.match(/^([^=]+)=(.*)$/);if(kv&&sec&&!o[sec][kv[1].trim()])o[sec][kv[1].trim()]=kv[2].trim()}return o}

/* ---------- flag dictionary ---------- */
/* Code → export name. HSD/CC/EAF are confirmed by export_setting.xml (HIGHSD, CQCONF, EXPFAIL);
   the others follow the QuantStudio flag list and are marked as inferred. */
const FLAGS={
  HSD:["HIGHSD","High standard deviation in replicate group",1],
  CC:["CQCONF","Calculated Cq confidence below threshold",1],
  EAF:["EXPFAIL","Exponential algorithm failed",1],
  NHC:["AMPNC","Amplification in negative control",0],
  BPR:["BADROX","Bad passive reference signal",0],
  DRNMIN:["DRNMIN","Detection of minimum ΔRn",0],
  FOS:["OFFSCALE","Fluorescence off-scale",0],
  NA:["NOAMP","No amplification",0],
  HRN:["HIGHRN?","(meaning not documented in the file)",0],
  NS:["NOSIGNAL","No signal in well",0],
  EW:["EMPTY?","(meaning not documented in the file)",0],
  ORG:["OUTLIERRG","Outlier in replicate group",0],
  BAF:["BLFAIL","Baseline algorithm failed",0],
  TAF:["THOLDFAIL","Thresholding algorithm failed",0],
  CAF:["CTFAIL","Ct algorithm failed",0],
  ROXLOW:["ROXLOW","Low passive reference signal",0],
  ROXDROP:["ROXDROP","Passive reference signal drop",0]
};
const flagName=code=>FLAGS[code]?FLAGS[code][0]:code;

/* ---------- .eds parser ---------- */
const P="apldbio/sds/";
async function parseEds(name,bytes){
  const buf=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  const run={file:name,size:bytes.length,warnings:[]};
  run.sha256=await sourceSha256(bytes);
  const zip=await readZip(buf);
  run.entries=zip.entries;
  const get=async n=>zip.get(P+n);
  const text=async n=>{const u=await get(n);return u?new TextDecoder().decode(u):null};

  /* integrity: CRC of every entry + Tamper MD5 over all other entries in archive order */
  const md5=MD5();let tamperEntry=null;
  for(const en of zip.entries){if(en.dir)continue;const d=await zip.get(en.name);
    if(/extensions\/Tamper$/.test(en.name)){tamperEntry=d;continue}md5.update(d)}
  run.crcOk=zip.entries.filter(e=>!e.dir).every(e=>e.crcOk);
  run.crcBad=zip.entries.filter(e=>!e.dir&&!e.crcOk).map(e=>e.name);
  /* The software writes each digest byte with Integer.toHexString, i.e. without a leading zero
     (0x08 -> "8", 0x00 -> "0"). Both spellings are compared; the software's is reported. */
  const padded=md5.digest().toUpperCase(),computed=padded.match(/../g).map(h=>parseInt(h,16).toString(16).toUpperCase()).join("");
  if(tamperEntry){const stored=new TextDecoder().decode(tamperEntry).trim().replace(/^0X/i,"").toUpperCase();
    run.tamper={stored,computed,computedPadded:padded,ok:stored===computed||stored===padded}}else run.tamper={stored:"",computed,computedPadded:padded,ok:null};

  /* manifest + tools */
  const man=await text("Manifest.mf");run.manifest={};
  if(man)for(const l of man.split(/\r?\n/)){const m=l.match(/^([^:]+):\s*(.*)$/);if(m)run.manifest[m[1].trim()]=m[2].trim()}
  run.tools=[];const tx=await get("tools.xml");
  if(tx)for(const t of xml(tx).querySelectorAll("ToolInfo"))run.tools.push({name:t.getAttribute("name"),version:t.getAttribute("version"),id:t.getAttribute("id")});

  /* experiment.xml */
  const ex=await get("experiment.xml");if(!ex)throw new Error("experiment.xml not found — not a QuantStudio .eds file");
  const E=xml(ex).documentElement;const T=kid(E,"Type");
  run.exp={name:txt(E,"Name"),runState:txt(E,"RunState"),finalAnalysis:txt(E,"FinalAnalysisCompleted"),
    created:num(txt(E,"CreatedTime")),modified:num(txt(E,"ModifiedTime")),runStart:num(txt(E,"RunStartTime")),runEnd:num(txt(E,"RunEndTime")),
    fileName:txt(E,"FileName"),label:txt(E,"Label"),typeId:txt(T,"Id"),typeName:txt(T,"Name").replace(/Cт/g,"CT").trim(),typeNameRaw:txt(T,"Name"),experimentId:txt(E,"Id"),
    chemistry:txt(E,"ChemistryType"),mode:txt(E,"TCProtocolMode"),template:txt(E,"DNATemplateType"),instrumentTypeId:txt(E,"InstrumentTypeId"),
    blockTypeId:txt(E,"BlockTypeID"),plateTypeId:txt(E,"PlateTypeID"),operator:txt(E,"Operator")||txt(E,"UserName"),comment:txt(E,"Comment")||txt(E,"Description"),barcode:txt(E,"Barcode")};
  run.exp.samples=kids(kid(E,"Samples"),"Sample").map(s=>({name:txt(s,"Name"),color:argb(txt(s,"Color")),conc:txt(s,"Concentration")}));
  run.exp.detectors=kids(kid(E,"Detectors"),"Detector").map(d=>({name:txt(d,"Name"),reporter:txt(d,"Reporter"),quencher:txt(d,"Quencher"),color:argb(txt(d,"Color"))}));
  run.exp.props={};
  run.exp.reagents=kids(kid(E,"Reagents"),"Reagent").map(g=>({type:txt(g,"Type"),name:txt(g,"Name"),part:txt(g,"PartNumber"),lot:txt(g,"LotNumber"),expiration:txt(g,"ExpirationDate")}));
  for(const p of E.querySelectorAll('ExperimentProperty[type="InstrumentInfo"] > PropertyValue'))run.exp.props[p.getAttribute("key")]=p.firstElementChild?p.firstElementChild.textContent:p.textContent.trim();
  const itk=E.querySelector('ExperimentProperty[type="InstrumentTypeInfo"] PropertyValue[key="INSTRUMENT_TYPE_KEY"]');
  run.exp.instrumentTypeKey=itk?itk.textContent.trim():"";

  /* plate_setup.xml */
  const ps=await get("plate_setup.xml");const plate={rows:8,cols:12,wells:[],passiveRef:"",kind:""};
  if(ps){const D=xml(ps).documentElement;
    plate.rows=+txt(D,"Rows")||8;plate.cols=+txt(D,"Columns")||12;plate.passiveRef=txt(D,"PassiveReferenceDye");
    plate.kind=txt(kid(D,"PlateKind"),"Name");plate.barcode=txt(D,"BarCode");plate.hasBarcode=!!kid(D,"BarCode");plate.description=txt(D,"Description");
    const N=plate.rows*plate.cols;for(let i=0;i<N;i++)plate.wells.push({i,pos:wellPos(i,plate.cols),sample:"",sampleColor:null,tasks:[],flags:[],omit:false,comment:""});
    for(const fm of kids(D,"FeatureMap")){const id=txt(kid(fm,"Feature"),"Id");
      for(const fv of kids(fm,"FeatureValue")){const w=plate.wells[+txt(fv,"Index")];if(!w)continue;const it=kid(fv,"FeatureItem");
        if(id==="sample"){const s=kid(it,"Sample");w.sample=txt(s,"Name");w.sampleColor=argb(txt(s,"Color"))}
        else if(id==="detector-task"){for(const dtk of kid(it,"DetectorTaskList")?kids(kid(it,"DetectorTaskList"),"DetectorTask"):[]){const d=kid(dtk,"Detector");
          w.tasks.push({target:txt(d,"Name"),reporter:txt(d,"Reporter"),quencher:txt(d,"Quencher"),color:argb(txt(d,"Color")),task:txt(dtk,"Task"),quantity:txt(dtk,"Concentration")})}}
        else if(id==="comment"){w.comment=it.textContent.trim()}
      }}
    for(const wl of kids(kid(D,"Wells"),"Well")){const w=plate.wells[+txt(wl,"Index")];if(!w)continue;
      w.omit=txt(wl,"IsOmit")==="true";w.flags=kids(wl,"FlagName").map(f=>{const [code,...t]=f.textContent.trim().split("-");return{code,target:t.join("-")}})}
  }
  run.plate=plate;

  /* tcprotocol.xml */
  const tc=await get("tcprotocol.xml");run.protocol={stages:[],filters:[]};
  if(tc){const D=xml(tc).documentElement;
    Object.assign(run.protocol,{runMode:txt(D,"RunMode"),volume:num(txt(D,"SampleVolume")),cover:num(txt(D,"CoverTemperature")),blockId:txt(D,"BlockID")});
    for(const st of kids(D,"TCStage"))run.protocol.stages.push({flag:txt(st,"StageFlag"),reps:+txt(st,"NumOfRepetitions"),
      steps:kids(st,"TCStep").map(s=>({temps:kids(s,"Temperature").map(t=>+t.textContent),hold:+txt(s,"HoldTime"),ramp:num(txt(s,"RampRate")),collect:(+txt(s,"CollectionFlag")||0)>0,collectMode:txt(s,"CollectionMode")||((+txt(s,"CollectionFlag"))===1?"Step":"")}))});
    run.protocol.filters=Array.from(D.querySelectorAll("CollectionProfile FilterSet")).map(f=>`${f.getAttribute("Excitation")}-${f.getAttribute("Emission")}`);
  }

  /* analysis_protocol.xml */
  const ap=await get("analysis_protocol.xml");const A={detectors:{},defaults:{},ddct:{},rules:[],smoothing:null,dataSelect:{},wellOverrides:0,algorithm:"",wells:{}};
  if(ap){const D=xml(ap).documentElement;
    for(const s of kids(D,"JaxbAnalysisSettings")){const type=txt(s,"Type").split(".").pop();const v={};
      for(const sv of kids(s,"JaxbSettingValue")){const it=kid(sv,"JaxbValueItem");v[txt(sv,"Name")]=it?it.textContent.trim():""}
      const obj=v.ObjectName||"";
      if(type==="IDetectorSettings"){const rec={threshold:num(v.Threshold),autoCt:v.AutoCt==="true",autoBaseline:v.AutoBaseline==="true",bStart:+v.BaselineStart,bStop:+v.BaselineStop,confidence:num(v.ConfidenceLevel)};
        if(obj.includes("DEFAULT"))A.defaults=rec;else A.detectors[obj]=rec}
      else if(type==="IDDCtAnalysisSettings")A.ddct=v;
      else if(type==="ISignalSmoothingSettings")A.smoothing=v.SignalSmoothing==="true";
      else if(type==="IDataSelectSettings")A.dataSelect=v;
      else if(type==="IAlgorithmSelectSettings"&&!A.algorithm)A.algorithm=v.AlgorithmName;
      else if(type==="IWellSettings"&&v.WellIndex!=null){
        if(obj&&!obj.includes("DEFAULT"))A.wells[`${v.WellIndex}|${obj}`]={autoBaseline:v.AutoBaseline==="true",bStart:num(v.BaselineStart),bStop:num(v.BaselineStop),useDefaults:v.UseDetectorDefaults==="true"};
        if(v.UseDetectorDefaults==="false")A.wellOverrides++;}
    }
    for(const s of D.querySelectorAll("AnalysisSetting")){const r={code:txt(s,"Type")};
      for(const sv of kids(s,"SettingValue")){const n=txt(sv,"Name");const val=(kid(sv,"StringValue")||kid(sv,"BooleanValue")||kid(sv,"IntValue")||kid(sv,"DoubleValue"));r[n]=val?val.textContent.trim():""}
      A.rules.push(r)}
  }
  run.analysis=A;

  /* multicomponentdata.xml */
  const mc=await get("multicomponentdata.xml");run.mc={dyes:[],signal:{},cycles:0};
  if(mc){const D=xml(mc).documentElement;run.mc.cycles=+txt(D,"CycleCount");const dyeMap={};
    for(const d of kids(D,"DyeData"))dyeMap[d.getAttribute("WellIndex")]=bracketList(txt(d,"DyeList"));
    const all=new Set();
    for(const s of kids(D,"SignalData")){const wi=s.getAttribute("WellIndex");const dl=dyeMap[wi]||[];const o={};
      kids(s,"CycleData").forEach((c,k)=>{const name=dl[k]||`dye${k+1}`;all.add(name);o[name]=bracketList(c.textContent).map(Number)});
      run.mc.signal[+wi]=o}
    run.mc.dyes=[...all];
  }

  /* filterdata.xml (raw, not normalised) */
  const fd=await get("filterdata.xml");run.raw={sets:[],data:{},cycles:0};
  if(fd){const D=xml(fd).documentElement;
    for(const pd of D.querySelectorAll("PlateData")){const at={};
      for(const a of kids(pd,"Attribute"))at[txt(a,"key")]=txt(a,"value");
      const set=at.FILTER_SET,cyc=+at.CYCLE;if(!set||!cyc)continue;
      if(!run.raw.data[set]){run.raw.data[set]=[];run.raw.sets.push(set)}
      run.raw.data[set][cyc-1]=txt(pd,"WellData").split(/\s+/).filter(Boolean).map(Number);
      run.raw.cycles=Math.max(run.raw.cycles,cyc);
    }
    run.raw.sets.sort();
  }

  /* analysis_result.txt */
  const ar=await text("analysis_result.txt");run.results=[];run.stdCurves={};
  if(ar){let cur=null;const lines=ar.split(/\r?\n/);run.resultHeader=(lines[1]||"").split("\t");
    for(const line of lines.slice(2)){if(!line)continue;const f=line.split("\t");
      if(/^\d+$/.test(f[0])){cur={f,well:+f[0],sample:f[1],target:f[2],task:f[3],ct:num(f[4]),ctMean:num(f[5]),ctSd:num(f[6]),dct:num(f[7]),
          qty:num(f[8]),qtyMean:num(f[9]),qtySd:num(f[10]),amp:f[11]??"",conf:num(f[12]),rn:[],drn:[]};run.results.push(cur)}
      else if(!cur)continue;
      else if(f[0]==="Rn values"){cur.rnS=f.slice(1).filter(x=>x.trim()!=="");cur.rn=cur.rnS.map(Number);}
      else if(f[0]==="Delta Rn values"){cur.drnS=f.slice(1).filter(x=>x.trim()!=="");cur.drn=cur.drnS.map(Number);}
      else if(f[0]==="Std Curve Results"){const sc={target:f[1],r2:num(f[2]),slope:num(f[3]),field4:f[4],yIntercept:num(f[5]),field6:f[6]};
        sc.efficiency=sc.slope<0?(Math.pow(10,-1/sc.slope)-1)*100:null;cur.stdCurve=sc;
        if(!run.stdCurves[sc.target])run.stdCurves[sc.target]=sc;}
      else if(f[0]==="Std Curve Results X Values"){if(run.stdCurves[cur.target]&&!run.stdCurves[cur.target].x)run.stdCurves[cur.target].x=f.slice(1).filter(x=>x.trim()!=="").map(Number);}
      else if(f[0]==="Std Curve Results Y Values"){if(run.stdCurves[cur.target]&&!run.stdCurves[cur.target].y)run.stdCurves[cur.target].y=f.slice(1).filter(x=>x.trim()!=="").map(Number);}
      else if(f[0]==="DDCT Values")cur.ddct={dct:num(f[7]),dctMean:num(f[8]),dctSd:num(f[9]),dctSe:num(f[10]),field11:f[11],rq:num(f[12]),rqMin:num(f[13]),rqMax:num(f[14]),omitted:f[15],ddct:num(f[16]),biogroup:f[2]};
      else if(f[0]==="Study Stat Values")cur.studyStat=f.slice(1);
      else if(f[0]==="Study RQ Values")cur.studyRq=f.slice(1);
    }}
  /* Keep amplification cycles separate from acquisition points.  A melt-only
     acquisition can contain many temperature points, and a PCR+melt file can
     contain both the amplification and melt acquisitions.  Stored traces stay
     untouched; only the cycle metadata and undetermined test use the
     quantification/cycling program. */
  const stagePrograms=Array.isArray(run.protocol&&run.protocol.stages)?run.protocol.stages:[];
  const ampStages=stagePrograms.filter(st=>!/^pre[_ -]?cycling/i.test(String(st.flag||""))&&/cycling|ampl|quant/i.test(`${st.flag||""} ${st.mode||""}`));
  const amplificationCycles=ampStages.reduce((n,st)=>n+Math.max(0,Number(st.reps)||0),0);
  const acquisitionCycles=run.mc.cycles||run.raw.cycles||(run.results[0]?run.results[0].drn.length:0);
  const hasProgramInfo=stagePrograms.length>0;
  const ampCycleLimit=hasProgramInfo?amplificationCycles:Math.min(acquisitionCycles||40,50);
  const meltStages=stagePrograms.filter(st=>/melt|dissoc/i.test(`${st.flag||""} ${st.mode||""}`));
  run.amplificationCycles=ampCycleLimit;
  run.acquisitionCycles=acquisitionCycles;
  run.meltAcquisitionPoints=meltStages.length?Math.max(0,acquisitionCycles-ampCycleLimit):0;
  run.cycles=ampCycleLimit||acquisitionCycles;
  for(const r of run.results){
    const w=plate.wells[r.well];r.pos=w?w.pos:String(r.well);
    const t=w&&w.tasks.find(x=>x.target===r.target);r.reporter=t?t.reporter:"";r.quencher=t?t.quencher:"";
    r.flags=w?w.flags.filter(f=>f.target===r.target).map(f=>f.code):[];r.omit=w?w.omit:false;
    r.undetermined=r.ct==null||(ampCycleLimit>0&&r.ct>=ampCycleLimit);
    const ds=A.detectors[r.target]||A.defaults;r.threshold=ds?ds.threshold:null;
    const ws=A.wells[`${r.well}|${r.target}`];r.baseline=ws?{auto:ds?ds.autoBaseline:ws.autoBaseline,start:ws.bStart,stop:ws.bStop}:(ds?{auto:ds.autoBaseline,start:ds.bStart,stop:ds.bStop}:null);
    r.ctRecalc=recalcCt(r.drn,r.threshold);
    r.ctDelta=(!r.undetermined&&r.ctRecalc!=null)?r.ctRecalc-r.ct:null;
    r.empty=!r.sample;r.ampLabel={"1":"Amp","0":"Inconclusive","-1":"No Amp"}[String(r.amp).trim()]||r.amp;
  }

  /* quant header (instrument block) */
  const q=zip.entries.find(e=>/\/quant\/.+\.quant$/.test(e.name));run.quantCount=zip.entries.filter(e=>/\.quant$/.test(e.name)).length;
  run.inst={};
  if(q){const t=new TextDecoder().decode(await zip.get(q.name));const m=t.match(/\[instrument\]\s*\n([^\n]+)\n([^\n]+)/);
    if(m){const k=m[1].trim().split("\t"),v=m[2].trim().split("\t");k.forEach((kk,i)=>run.inst[kk]=v[i])}}

  /* calibrations */
  run.calibrations=[];
  for(const en of zip.entries.filter(e=>/calibrations\/[^/]+\.ini$/.test(e.name))){
    const itxt=new TextDecoder().decode(await zip.get(en.name)),o=ini(itxt);const h=o.head||{};
    if(typeof ccCalibSummary==="function"){const cs=ccCalibSummary(en.name,itxt);if(cs)run.ccCalib=Object.assign(run.ccCalib||{},cs);}
    run.calibrations.push({file:en.name.split("/").pop(),name:h.name||"",id:h.calibrationID||"",operator:h.operator||"",ts:num(h.timestamp),exp:num(h.expirytime),version:h.version||""});
  }
  const pdm=await text("puredyematrix.txt");run.pureDyes=pdm?((pdm.match(/^dyes=(.*)$/m)||[])[1]||"").split(",").filter(Boolean):[];

  /* messages.log */
  const log=await text("messages.log");run.log=log?parseLog(log):null;
  /* control-chart extraction (functions live in the page; the raw text is not kept) */
  run.ccLog=(log&&typeof ccQsLog==="function")?ccQsLog(log):null;
  const mf=await text("instrumentdata.mf");run.ccMf=(mf&&typeof ccParseJavaDate==="function")?ccParseJavaDate(mf.split(/\r?\n/)[0]):NaN;
  if(typeof ccQuantSaturation==="function"){const qt=[];
    for(const en of zip.entries.filter(e=>/\/quant\/[^/]+\.quant$/.test(e.name)))qt.push(new TextDecoder().decode(await zip.get(en.name)));
    run.ccSat=qt.length?ccQuantSaturation(qt):null;}
  /* provenance written by the instrument into the raw-data parts */
  run.provenance={quantRunNames:[],exportSetting:null,plateIni:null};
  const qx=zip.entries.filter(e=>/\/quant\/[^/]+\.xml$/.test(e.name)).slice(0,12);
  for(const en of qx){const t=new TextDecoder().decode(await zip.get(en.name));
    for(const m of t.matchAll(/experiments\/([^/<]+)\/apldbio/g))if(!run.provenance.quantRunNames.includes(m[1]))run.provenance.quantRunNames.push(m[1]);}
  const es=await get("export_setting.xml");
  if(es){const D=xml(es).documentElement,seen=new Set(),sets=[];
    for(const d of kids(D,"DataSettings")){const type=txt(d,"Type");if(seen.has(type))continue;seen.add(type);
      const cols=kids(d,"ColumnSettings").map(c=>({id:txt(c,"Id"),order:+txt(c,"Order"),inc:txt(c,"Included")==="true"})).filter(c=>c.inc).sort((a,b)=>a.order-b.order).map(c=>c.id);
      sets.push({type,title:txt(d,"Title"),omit:txt(d,"Omit")==="true",skipEmpty:txt(d,"SkipEmptyWell")==="true",cols});}
    run.provenance.exportSetting={format:txt(D,"ExportFormat"),outputFormat:txt(D,"OutputFormat"),fileName:txt(D,"ExportFileName"),
      location:txt(D,"ExportFileLocation"),sets};}
  const pi=await text("plate_setup.ini");
  if(pi){const o=ini(pi);run.provenance.plateIni={dyes:((o.dye||{}).dyes||"").split(",").map(x=>x.trim()).filter(Boolean),reference:(o.dye||{}).reference||"",wells:Object.keys(o.layout||{}).length};}
  if(run.log){run.inst.product=run.log.props.product||"";run.inst.hostname=run.log.props.hostname||"";run.inst.firmware=run.log.version||run.inst.version}

  run.isTemplate=/\.edt$/i.test(run.file)||run.exp.runState==="INIT";
  run.id=`${run.file}#${run.sha256.slice(0,8)}`;
  run.sampleSet=[...new Set(run.results.filter(r=>r.sample).map(r=>r.sample))];
  run.targets=[...new Set(run.results.map(r=>r.target))];
  return run;
}

/* Ct re-derivation: last upward crossing of the stored threshold by the stored ΔRn, linear interpolation.
   Cycle numbers are 1-based. The instrument software may smooth first, so small differences are expected. */
function recalcCt(drn,thr){
  if(!drn||!drn.length||thr==null)return null;let ct=null;
  for(let i=1;i<drn.length;i++)if(drn[i-1]<thr&&drn[i]>=thr)ct=i+(thr-drn[i-1])/(drn[i]-drn[i-1]);
  return ct;
}

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

function studyRows(r){const out=[],seen=new Set();
  for(const x of r.results){if(!x.studyStat||x.studyStat[0]==="-1.0")continue;const k=x.sample+"|"+x.target;if(seen.has(k))continue;seen.add(k);
    const s=x.studyStat.map(num),q=(x.studyRq||[]).map(num);
    out.push({sample:x.sample,target:x.target,df:s[0],mean:s[1],median:s[2],sd:s[3],se:s[4],rq:q[1],rqMin:q[2],rqMax:q[3],ddct:q[4]})}
  return out}


/* ---------- QuantStudio export layout, rebuilt from the .eds itself ----------
   Column choice and order come from export_setting.xml (the export configuration the
   software saves inside the document); "Well Position" is always second, as the software
   writes it. Row order, blank rows for empty wells and the six-space well-position prefix
   of the Raw and Multicomponent sheets follow the vendor export of the same files. */
const QS_DEFAULT_COLS={
  plate_setup:["Well","Well Position","Sample Name","Sample Color","Biogroup Name","Biogroup Color","Target Name","Target Color","Task","Reporter","Quencher","Quantity","Comments"],
  amplification_data:["Well","Well Position","Cycle","Target Name","Rn","Delta Rn"],
  reagent_information:["Reagent Type","Reagent Name","Reagent Part Number","Reagent Lot Number","Reagent Expiration Date"],
  analysis_result_rq:["Well","Well Position","Omit","Sample Name","Target Name","Task","Reporter","Quencher","Quantity","Quantity Mean","Quantity SD","RQ","RQ Min","RQ Max","CT","Ct Mean","Ct SD","Delta Ct","Delta Ct Mean","Delta Ct SD","Delta Ct SE","Delta Delta Ct","Automatic Ct Threshold","Ct Threshold","Automatic Baseline","Baseline Start","Baseline End","Amp Status","Comments","Cq Conf"],
  analysis_result_std:["Well","Well Position","Omit","Sample Name","Target Name","Task","Reporter","Quencher","CT","Ct Mean","Ct SD","Quantity","Quantity Mean","Quantity SD","Y-Intercept","R(superscript 2)","Slope","Efficiency","Automatic Ct Threshold","Ct Threshold","Automatic Baseline","Baseline Start","Baseline End","Amp Status","Comments"]
};
function qsCols(r,type,fallback){
  const es=r.provenance&&r.provenance.exportSetting,set=es&&es.sets.find(s=>s.type===type);
  let cols=set&&set.cols.length?set.cols.slice():fallback.slice();
  if(cols.includes("Well Position")&&cols[0]==="Well"){cols=cols.filter(c=>c!=="Well Position");cols.splice(1,0,"Well Position");}
  return cols;
}
const pad2=n=>String(n).padStart(2,"0");
function qsCalDate(ms){if(!ms)return "";const d=new Date(ms);return `${pad2(d.getMonth()+1)}-${pad2(d.getDate())}-${d.getFullYear()}`;}
function qsStamp(ms){
  if(!ms)return "";const d=new Date(ms);
  let tz="";try{tz=new Intl.DateTimeFormat("en-GB",{timeZoneName:"short"}).formatToParts(d).find(p=>p.type==="timeZoneName").value;}catch(e){}
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${d.getHours()<12?"AM":"PM"}${tz?" "+tz:""}`;
}
const qsRGB=c=>c?c.replace(/\s/g,"").replace(/^rgb/i,"RGB"):"";
/* Instrument family and block, from the saved type key when the InstrumentInfo block is absent
   (verified against the vendor templates: PERFORM = QuantStudio 5, AFFORD = QuantStudio 3, PICANTO = QuantStudio 1). */
function qsInstrument(r){
  const e=r.exp,p=e.props||{},key=e.instrumentTypeKey||"";
  let model="",block="";
  const m=(p.instrumentType||"").match(/QuantStudio\s*(\d+)\s*-\s*(.*)$/i);
  if(m){model=m[1];block=m[2];}
  if(!model)model=/PERFORM/.test(key)?"5":/AFFORD/.test(key)?"3":/PICANTO/.test(key)?"1":/384WELL/.test(key)?"5":"";
  if(!block){const v=key.match(/(\d+)WELL(?:_[A-Z]+)?_(\d+)UL/);
    if(v)block=v[1]==="384"?"384-Well Block":`${v[1]}-Well ${(Number(v[2])/1000).toFixed(1)}-mL Block`;}
  const sn=p.instrumentSerialNumber||(r.inst||{}).sn||"";
  return {model,block:block||r.plate.kind,type:model?`QuantStudio™ ${model} System`:"",serial:sn,
    name:p.instrumentName!=null&&p.instrumentName!==""?p.instrumentName:(sn?"      "+sn:"")};
}
/* Java HashMap iteration order: the software lists targets per well in this order in its export. */
function javaHashOrder(names){
  const cap=(()=>{let c=16;while(names.length>c*0.75)c*=2;return c;})();
  const h=s=>{let x=0;for(const ch of s)x=(Math.imul(31,x)+ch.charCodeAt(0))|0;return x>>>0;};
  return names.map((n,i)=>({n,i,b:((h(n)^(h(n)>>>16))&(cap-1))})).sort((a,b)=>a.b-b.b||a.i-b.i).map(x=>x.n);
}
function qsHeader(r,opt){
  const e=r.exp,p=e.props||{},I=qsInstrument(r),start=e.runStart||Date.now(),cal=n=>r.calibrations.find(c=>c.name===n)||{};
  const expired=c=>c&&c.exp?(c.exp<start?"Yes":"No"):"";
  const H=[["Block Type",I.block]];
  const bg=cal("BackgroundCalibration"),pd=cal("PureDyeCalibration"),roi=cal("ROICalibration"),un=cal("UniformityCalibration");
  H.push(["Calibration Background is expired ",expired(bg)],["Calibration Background performed on",qsCalDate(bg.ts)]);
  (r.pureDyes||[]).forEach(d=>H.push([`Calibration Pure Dye ${d} is expired`,expired(pd)],[`Calibration Pure Dye ${d} performed on`,qsCalDate(pd.ts)]));
  H.push(["Calibration ROI is expired ",expired(roi)],["Calibration ROI performed on",qsCalDate(roi.ts)]);
  H.push(["Calibration Uniformity is expired ",expired(un)],["Calibration Uniformity performed on",qsCalDate(un.ts)]);
  H.push(["Chemistry",e.chemistry],["Date Created",qsStamp(Date.now())]);
  if(r.plate.hasBarcode)H.push(["Experiment Barcode",r.plate.barcode||""]);
  H.push(["Experiment File Name",opt.pseudo?"(withheld)":e.fileName],["Experiment Name",e.name],
    ["Experiment Run End Time",qsStamp(e.runEnd)],["Experiment Type",e.typeNameRaw||e.typeName],
    ["Instrument Name",I.name],["Instrument Serial Number",I.serial],["Instrument Type",I.type],
    ["Passive Reference",!r.plate.passiveRef||r.plate.passiveRef==="NULL"?"":r.plate.passiveRef],
    ["Post-read Stage/Step",""],["Pre-read Stage/Step",""],["Quantification Cycle Method","Ct"],
    ["Signal Smoothing On",r.analysis.smoothing==null?"":String(r.analysis.smoothing)],
    ["Stage/ Cycle where Ct Analysis is performed",r.analysis.dataSelect.StageNum?`Stage${r.analysis.dataSelect.StageNum}, Step${r.analysis.dataSelect.StepNum}`:""]);
  return H;
}
function qsTables(r,opt){
  opt=opt||{};const nm=s=>s?(opt.nameOf?opt.nameOf(s):s):"";
  const W=r.plate.wells,N=W.length,cyc=r.cycles||40,A=r.analysis,isRq=r.exp.typeId==="rq";
  const sheets=[];
  /* Sample Setup */
  const scCols=qsCols(r,"plate_setup",QS_DEFAULT_COLS.plate_setup),scRows=[];
  W.forEach(w=>{
    const base={"Well":w.i+1,"Well Position":w.pos,"Sample Name":nm(w.sample),"Sample Color":qsRGB(w.sampleColor),"Biogroup Name":"","Biogroup Color":"","Comments":w.comment||""};
    if(!w.tasks.length)scRows.push(Object.assign({},base,{"Target Name":"","Target Color":"","Task":"","Reporter":"","Quencher":"","Quantity":null}));
    w.tasks.forEach(t=>scRows.push(Object.assign({},base,{"Target Name":t.target,"Target Color":qsRGB(t.color),"Task":t.task,
      "Reporter":t.reporter,"Quencher":t.quencher,"Quantity":t.task==="STANDARD"?num(t.quantity):null})));
  });
  sheets.push({name:"Sample Setup",cols:scCols,rows:scRows});
  /* Raw Data */
  const sets=r.raw.sets,rawCols=qsCols(r,"raw_spectra",["Well","Well Position","Cycle",...sets.map((s,i)=>"Filter "+(i+1))])
    .map(c=>{const m=c.match(/^Filter (\d+)$/);return m?(sets[+m[1]-1]||c):c;}).filter(c=>!/^Filter \d+$/.test(c));
  const rawRows=[];
  for(let c=0;c<r.raw.cycles;c++)W.forEach(w=>{const o={"Well":w.i+1,"Well Position":"      "+w.pos,"Cycle":c+1};
    sets.forEach(s=>{const v=((r.raw.data[s]||[])[c]||[])[w.i];o[s]=v==null?null:v;});rawRows.push(o);});
  sheets.push({name:"Raw Data",cols:rawCols,rows:rawRows});
  /* Amplification Data */
  const byWell=new Map();r.results.forEach(x=>{if(!byWell.has(x.well))byWell.set(x.well,[]);byWell.get(x.well).push(x);});
  const targetOrder=javaHashOrder(r.exp.detectors.map(d=>d.name).filter(n=>r.results.some(x=>x.target===n)));
  byWell.forEach(v=>v.sort((a,b)=>targetOrder.indexOf(a.target)-targetOrder.indexOf(b.target)));
  const ampRows=[];
  W.forEach(w=>{const res=byWell.get(w.i)||[];
    if(!res.length){for(let c=0;c<cyc;c++)ampRows.push({"Well":w.i+1,"Well Position":w.pos,"Cycle":c+1,"Target Name":null,"Rn":"","Delta Rn":""});return;}
    res.forEach(x=>{for(let c=0;c<x.rn.length;c++)ampRows.push({"Well":w.i+1,"Well Position":w.pos,"Cycle":c+1,"Target Name":x.target,
      "Rn":x.rnS?x.rnS[c]:x.rn[c],"Delta Rn":x.drnS?(x.drnS[c]??""):(x.drn[c]??"")});});});
  sheets.push({name:"Amplification Data",cols:qsCols(r,"amplification_data",QS_DEFAULT_COLS.amplification_data),rows:ampRows});
  /* Multicomponent Data */
  const mcCols=qsCols(r,"multi_component",["Well","Well Position","Cycle",...r.mc.dyes]),mcRows=[];
  for(let c=0;c<r.mc.cycles;c++)W.forEach(w=>{const sg=r.mc.signal[w.i]||{},o={"Well":w.i+1,"Well Position":"      "+w.pos,"Cycle":c+1};
    Object.keys(sg).forEach(d=>o[d]=sg[d][c]);mcRows.push(o);});
  sheets.push({name:"Multicomponent Data",cols:mcCols,rows:mcRows,ragged:true});
  /* Relative quantification summaries */
  const taskOf=x=>((W[x.well]||{}).tasks||[]).find(t=>t.target===x.target)||{};
  if(isRq){
    const cols=["Sample Name","Target Name","Task","RQ","RQ Min","RQ Max","Ct Mean","Delta Ct Mean","Delta Ct SD","Delta Delta Ct"];
    const order=[];W.forEach(w=>{if(w.tasks.length&&!order.includes(w.sample))order.push(w.sample);});
    const rows=[];
    order.forEach(s=>{const targets=[...new Set(r.results.filter(x=>x.sample===s).map(x=>x.target))].sort();
      targets.forEach(t=>{const g=r.results.filter(x=>x.sample===s&&x.target===t),det=g.find(x=>!x.undetermined),
        st=g.find(x=>x.studyStat&&x.studyStat[0]!=="-1.0"),q=st?(st.studyRq||[]).map(num):[],ss=st?st.studyStat.map(num):[];
        rows.push({"Sample Name":s?nm(s):" ","Target Name":t,"Task":taskOf(g[0]).task||"",
          "RQ":q[1]??null,"RQ Min":q[2]??null,"RQ Max":q[3]??null,"Ct Mean":det?det.ctMean:null,
          "Delta Ct Mean":st?ss[1]:null,"Delta Ct SD":st?ss[3]:null,"Delta Delta Ct":q[4]??null});});});
    const tail=[["Analysis Type",A.ddct.Multiplex==="true"?"Multiplex":"Singleplex"],["Endogenous Control",A.ddct.EndogenousControl||""],
      ["RQ Min/Max Confidence Level",A.ddct.RQConfidence||""]];
    sheets.push({name:"Technical Analysis Result",cols,rows,tail:[...tail,["Reference Sample",A.ddct.Calibrator||""]]});
    sheets.push({name:"BioGroup Analysis Result",cols:["Biogroup Name",...cols.slice(1)],rows:[],tail:[...tail,["Reference Biogroup Name","null"]]});
  }
  /* Results */
  const flagIds=Object.values(FLAGS).map(f=>f[0]);
  const resCols=qsCols(r,"analysis_result",isRq?QS_DEFAULT_COLS.analysis_result_rq:QS_DEFAULT_COLS.analysis_result_std);
  const order=[];W.forEach(w=>w.tasks.forEach(t=>{const x=r.results.find(y=>y.well===w.i&&y.target===t.target);if(x)order.push(x);}));
  r.results.forEach(x=>{if(!order.includes(x))order.push(x);});
  const resRows=order.map(x=>{
    const w=W[x.well]||{},ds=A.detectors[x.target]||A.defaults||{},dd=x.ddct||{},sc=(r.stdCurves||{})[x.target]||null,f=x.f||[];
    const o={"Well":x.well+1,"Well Position":x.pos,"Omit":String(!!x.omit),"Sample Name":nm(x.sample),"Target Name":x.target,
      "Task":taskOf(x).task||"","Reporter":x.reporter,"Quencher":x.quencher,
      "Quantity":num(f[8]),"Quantity Mean":num(f[9]),"Quantity SD":num(f[10]),
      "RQ":dd.rq??null,"RQ Min":dd.rqMin??null,"RQ Max":dd.rqMax??null,
      "CT":x.undetermined?"Undetermined":x.ct,"Ct Mean":x.ctMean,"Ct SD":x.ctSd,
      "Delta Ct":dd.dct??null,"Delta Ct Mean":dd.dctMean??null,"Delta Ct SD":dd.dctSd??null,"Delta Ct SE":dd.dctSe??null,"Delta Delta Ct":dd.ddct??null,
      "Y-Intercept":sc?sc.yIntercept:null,"R(superscript 2)":sc?sc.r2:null,"Slope":sc?sc.slope:null,"Efficiency":sc?sc.efficiency:null,
      "Automatic Ct Threshold":String(!!ds.autoCt),"Ct Threshold":ds.threshold??null,
      "Automatic Baseline":String(!!ds.autoBaseline),"Baseline Start":x.baseline?x.baseline.start:null,"Baseline End":x.baseline?x.baseline.stop:null,
      "Amp Status":x.ampLabel,"Comments":w.comment||"","Cq Conf":x.conf,"Tm1":null,"Tm2":null,"Tm3":null};
    flagIds.forEach(id=>o[id]=x.flags.some(c=>flagName(c)===id)?"Y":"N");
    return o;
  });
  sheets.push({name:"Results",cols:resCols,rows:resRows,tail:isRq?[["Analysis Type",A.ddct.Multiplex==="true"?"Multiplex":"Singleplex"],
    ["Endogenous Control",A.ddct.EndogenousControl||""],["RQ Min/Max Confidence Level",A.ddct.RQConfidence||""],["Reference Sample",A.ddct.Calibrator||""]]:null});
  sheets.push({name:"Reagent Information",cols:QS_DEFAULT_COLS.reagent_information,
    rows:(r.exp.reagents.length?r.exp.reagents:[{}]).map(g=>({"Reagent Type":g.type||"","Reagent Name":g.name||"","Reagent Part Number":g.part||"",
      "Reagent Lot Number":g.lot||"","Reagent Expiration Date":g.expiration||""}))});
  return {header:qsHeader(r,opt),sheets};
}
function qsExport(r,opt){
  const T=qsTables(r,opt),NL="\r\n",TAB="\t",cell=v=>v==null?"":String(v);
  let out=T.header.map(([k,v])=>`* ${k.trim()} = ${v??""}`).join(NL)+NL;
  if(opt&&opt.pseudo)out+="* Sample Names = pseudonymised by the exporting page"+NL;
  out+="* Exported By = qPCR QC and forensic export tool (layout of the QuantStudio export, rebuilt from the .eds; not produced by Thermo Fisher software)"+NL+NL;
  T.sheets.filter(s=>s.name!=="Reagent Information").forEach(s=>{
    out+=`[${s.name}]`+NL+s.cols.join(TAB)+NL;
    s.rows.forEach(row=>{out+=s.cols.map(c=>cell(row[c])).join(TAB).replace(/\t+$/,s.ragged?"":"$&")+NL;});
    (s.tail||[]).forEach(t=>{out+=t.join(TAB)+NL;});
    out+=NL;
  });
  return out;
}

return {parseEds,MD5,FLAGS,flagName,studyRows,qsExport,qsTables,qsInstrument,dt,recalcCt};
})();
