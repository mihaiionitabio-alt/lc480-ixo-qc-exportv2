const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const CODE=fs.readFileSync('rdml_support.js','utf8');
const PAGE=process.argv[2]||'page.html';
const b64=f=>fs.readFileSync(path.join('rdml',f)).toString('base64');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.split('\n')[0]));
await p.goto('file:///home/claude/c10/'+PAGE);
/* 1 · load the vendor .eds through the page's own intake */
await p.evaluate(()=>document.querySelector('nav button[data-tab="load"]').click());
await p.setInputFiles('#file',[path.resolve('rdml/CORPUS-RDML-1.eds')]);
await p.waitForFunction(()=>!document.querySelector('#read').disabled,null,{timeout:120000});
await p.click('#read');
await p.waitForFunction(()=>/Read \d+ run/.test(document.querySelector('#readmsg').innerText),null,{timeout:300000});
await p.addScriptTag({content:CODE});

console.log('--- priority: the same experiment as .eds and as .rdml');
console.log(JSON.stringify(await p.evaluate(async ({b64})=>{
  const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  const entries=await rdmlEntries(u8.buffer,null);
  const xml=new TextDecoder().decode(entries.find(e=>/^rdml_data\.xml$/i.test(e.name)).bytes);
  const imported=rdmlParse(xml,'CORPUS-RDML-1.rdml',u8);
  const merged=applyRawFilePriority([...RUNS,...imported]);
  return {loaded:RUNS.map(r=>r.file),imported:imported.map(r=>r.file),
    superseded:merged.superseded.map(r=>({file:r.file,by:r.supersededBy&&r.supersededBy.file,why:r.supersededReason})),
    gate:imported.map(r=>sopProcessingApplicability(r))};
},{b64:b64('CORPUS-RDML-1.rdml')}),null,1));

console.log('\n--- cross-format oracle: .eds Cq vs .rdml Cq, per well and target');
console.log(JSON.stringify(await p.evaluate(async ({b64})=>{
  const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  const entries=await rdmlEntries(u8.buffer,null);
  const xml=new TextDecoder().decode(entries.find(e=>/^rdml_data\.xml$/i.test(e.name)).bytes);
  const rd=rdmlParse(xml,'x.rdml',u8)[0];
  const key=w=>`${w.pos}|${String(w.target||'').toUpperCase()}`;
  const eds=new Map();RUNS[0].wells.forEach(w=>eds.set(key(w),resultCq(w)));
  let same=0,diff=[],onlyRdml=0,bothNull=0;
  rd.wells.forEach(w=>{
    if(!eds.has(key(w))){onlyRdml++;return;}
    const a=eds.get(key(w)),c=resultCq(w);
    if(a===null&&c===null){bothNull++;same++;return;}
    if(a!==null&&c!==null&&Math.abs(a-c)<0.0005){same++;return;}
    diff.push({well:w.well,target:w.target,eds:a,rdml:c});
  });
  return {edsRows:RUNS[0].wells.length,rdmlRows:rd.wells.length,matched:same,bothUndetermined:bothNull,
    differing:diff.length,firstDiffs:diff.slice(0,5),inRdmlOnly:onlyRdml,
    edsTargets:[...new Set(RUNS[0].wells.map(w=>w.target))],rdmlTargets:[...new Set(rd.wells.map(w=>w.target))]};
},{b64:b64('CORPUS-RDML-1.rdml')}),null,1));

console.log('\n--- raw RDML through the page: findings and the profile verdict');
for(const f of ['example_1_raw.rdml','example_3_linregpcr.rdml']){
  console.log(f, JSON.stringify(await p.evaluate(async ({b64,name})=>{
    const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
    const entries=await rdmlEntries(u8.buffer,null);
    const xml=new TextDecoder().decode(entries.find(e=>/^rdml_data\.xml$/i.test(e.name)).bytes);
    const runs=rdmlParse(xml,name,u8);
    const keep=RUNS;RUNS=runs;assignRoles(RUNS);invalidateAnalysisCaches();SOP_CACHE=null;
    let out;
    try{
      const rising=RUNS.reduce((n,r)=>n+orphanCurveCandidates(r).length,0);
      const gate=RUNS.map(r=>sopProcessingApplicability(r));
      const meta=metaRows().length, ev=sopEvaluateAll();
      out={runs:RUNS.length,rising,metaRows:meta,
        gateStates:[...new Set(gate.map(g=>g.state))],gateReason:gate[0].reason,
        sopStatusToday:ev[0]&&ev[0].status};
    }finally{RUNS=keep;invalidateAnalysisCaches();SOP_CACHE=null;}
    return out;
  },{b64:b64(f),name:f})));
}
console.log('\npage errors:',errs.length?errs.slice(0,4):'none');
await b.close();})();
