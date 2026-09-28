const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const CODE=fs.readFileSync('rdml_support.js','utf8');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();
await p.goto('file:///home/claude/c10/page.html');
await p.addScriptTag({content:CODE});
for(const f of ['CORPUS-RDML-1.rdml','GeneExpression_ddCt_Fast_Adv_MMx_10uL.rdml','example_3_linregpcr.rdml']){
  const b64=fs.readFileSync(path.join('rdml',f)).toString('base64');
  console.log(f, JSON.stringify(await p.evaluate(async ({b64,name})=>{
    const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
    const e=await rdmlEntries(u8.buffer,null);
    const xml=new TextDecoder().decode(e.find(x=>/^rdml_data\.xml$/i.test(x.name)).bytes);
    const r=rdmlParse(xml,name,u8)[0];
    const cq=r.wells.map(w=>resultCq(w)).filter(v=>v!==null);
    const atCycles=cq.filter(v=>Math.abs(v-r.nCycles)<1e-9).length;
    const hist={};cq.forEach(v=>{const k=Math.round(v);hist[k]=(hist[k]||0)+1;});
    const top=Object.entries(hist).sort((a,b)=>b[1]-a[1]).slice(0,4);
    return {cycles:r.nCycles,rows:r.wells.length,withCq:cq.length,
      equalToCycleCount:atCycles,pctAtCeiling:+(100*atCycles/cq.length).toFixed(1),
      commonest:top,min:+Math.min(...cq).toFixed(2),max:+Math.max(...cq).toFixed(2)};
  },{b64,name:f})));
}
await b.close();})();
