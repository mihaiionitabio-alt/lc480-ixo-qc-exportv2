import pkg from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const DIR='/mnt/user-data/uploads/IXO/release_unified_2026-09-21_r2/demo_data/instruments/LC-DEMO-01';
const FILES=fs.readdirSync(DIR).sort().map(f=>path.join(DIR,f));
const sha=s=>crypto.createHash('sha256').update(typeof s==='string'?Buffer.from(s,'utf8'):s).digest('hex');

async function run(page_path,label){
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).split('\n')[0]));
  p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,120));});
  const t0=Date.now();
  await p.goto('file://'+page_path,{waitUntil:'load'});
  await p.waitForFunction(()=>typeof selCatalogue==='function',null,{timeout:60000});
  const ready=Date.now()-t0;
  await p.evaluate(()=>document.querySelector('nav button[data-tab="load"]').click());
  await p.setInputFiles('#file',FILES);
  await p.waitForFunction(()=>!document.querySelector('#read').disabled,null,{timeout:180000});
  await p.click('#read');
  await p.waitForFunction(()=>/Read \d+ run/.test(document.querySelector('#readmsg').innerText),null,{timeout:600000});
  const out=await p.evaluate(()=>{
    const cat=selCatalogue();
    SEL_STATE.ids.clear(); cat.forEach(x=>SEL_STATE.ids.add(x.id));
    const entries=selZipEntries();
    return {catalogue:cat.length, runs:RUNS.length,
      graphs:(typeof GRAPHS==='undefined'?0:GRAPHS.length),
      ccharts:(typeof CC_CHARTS==='undefined'?0:CC_CHARTS.length),
      insts:(typeof ccInstruments==='function'?ccInstruments().length:0),
      entries:entries.map(e=>({name:e.name,len:(e.data||'').length,data:e.data}))};
  });
  await b.close();
  const hashed=out.entries.map(e=>({name:e.name,len:e.len,sha:sha(e.data||'')}));
  console.error(`${label}: catalogue ${out.catalogue}, runs ${out.runs}, GRAPHS ${out.graphs}, CC ${out.ccharts}, instruments ${out.insts}, entries ${hashed.length}, ready ${ready}ms, errors ${errs.length}`);
  return {label,ready,errs,meta:{catalogue:out.catalogue,runs:out.runs,graphs:out.graphs,ccharts:out.ccharts,insts:out.insts},entries:hashed};
}
const A=await run(process.argv[2],'live');
const B=await run(process.argv[3],'candidate');
fs.writeFileSync('/home/claude/val/parity.json',JSON.stringify({A,B},null,1));
console.log('written');
