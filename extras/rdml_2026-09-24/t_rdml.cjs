const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const CODE=fs.readFileSync('rdml_support.js','utf8');
const files=fs.readdirSync('rdml').filter(f=>/\.rdml$/i.test(f)).sort();
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.split('\n')[0]));
await p.goto('file:///home/claude/c10/page.html');
await p.addScriptTag({content:CODE});
for(const f of files){
  const buf=fs.readFileSync(path.join('rdml',f));
  const r=await p.evaluate(async ({name,b64})=>{
    const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
    const t0=performance.now();
    try{
      const entries=await rdmlEntries(u8.buffer,null);
      if(!rdmlIsContainer(entries))return {name,error:'no rdml_data.xml; entries='+entries.map(e=>e.name)};
      const xml=new TextDecoder().decode(entries.find(e=>/^rdml_data\.xml$/i.test(e.name)).bytes);
      const runs=rdmlParse(xml,name,u8);
      const ms=+(performance.now()-t0).toFixed(0);
      return {name,ms,runs:runs.length,
        per:runs.map(x=>({run:x.meta.name,rows:x.rows,cols:x.cols,wells:x.wells.length,
          curves:Object.keys(x.allCurves).length,tm:x.tmWells.length,cycles:x.nCycles,melt:x.meltAcquisitionPoints,
          kinds:x.kinds.join('+'),targets:x.analyses.length,
          cq:x.wells.filter(w=>resultCq(w)!==null).length,
          zeroCq:x.wells.filter(w=>resultCq(w)===0).length,
          excl:x.wells.filter(w=>w.rdml.excl).length,note:x.wells.filter(w=>w.rdml.note).length,
          state:runProcessingState(x).state,
          integrity:integrityLabel(x)})),
        version:runs[0].rdmlDoc.version,methods:runs[0].rdmlDoc.methods};
    }catch(e){return {name,error:e.message};}
  },{name:f,b64:buf.toString('base64')});
  console.log(JSON.stringify(r));
}
console.log('page errors:',errs.length?errs.slice(0,3):'none');
await b.close();})();
