import pkg from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
const { chromium } = pkg; import fs from 'fs'; import path from 'path';
const DIR='/mnt/user-data/uploads/IXO/release_unified_2026-09-21_r2/demo_data/instruments/LC-DEMO-01';
const FILES=fs.readdirSync(DIR).sort().map(f=>path.join(DIR,f));
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e).split('\n')[0]));
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,140));});
await p.goto('file://'+process.argv[2],{waitUntil:'load'});
await p.evaluate(()=>document.querySelector('nav button[data-tab="load"]').click());
await p.setInputFiles('#file',FILES);
await p.waitForFunction(()=>!document.querySelector('#read').disabled,null,{timeout:180000});
await p.click('#read');
await p.waitForFunction(()=>/Read \d+ run/.test(document.querySelector('#readmsg').innerText),null,{timeout:600000});
const r=await p.evaluate(()=>{
  const out={img:[],cc:[]};
  selCatalogue().filter(x=>x.kind==='image').forEach(x=>{
    let specs=[],err=null,svg1='',svg2='';
    try{
      plotArm(); const f=x.figure(); specs=plotDisarm(); svg1=f.svg||'';
      svg2=(x.figure().svg)||'';                      // drawn a second time: must be identical
    }catch(e){ try{plotDisarm();}catch(_){}; err=String(e&&e.message||e); }
    (x.id.startsWith('cc:')?out.cc:out.img).push({
      id:x.id, title:x.title, specs:specs.length,
      traces:specs.reduce((n,o)=>n+((ixTraces(o)||[]).length),0),
      stable:(svg1!==''&&svg1===svg2), err});
  });
  return out;
});
await b.close();
fs.writeFileSync('/home/claude/val/ix2.json',JSON.stringify({errs,...r},null,1));
const f=(a)=>({n:a.length,ix:a.filter(x=>x.specs>0).length,svg:a.filter(x=>x.specs===0&&!x.err).length,
               err:a.filter(x=>x.err).length,stable:a.filter(x=>x.stable).length});
const G=f(r.img), C=f(r.cc);
console.log(`graphs         ${G.n} total | ${G.ix} interactive | ${G.svg} kept on their drawn SVG | ${G.err} failed | ${G.stable} redraw identically`);
console.log('   kept on SVG:', r.img.filter(x=>x.specs===0&&!x.err).map(x=>x.id.replace('img:','')).join(', ')||'-');
console.log('   failed     :', r.img.filter(x=>x.err).map(x=>x.id+' ('+x.err+')').join('; ')||'-');
console.log(`control charts ${C.n} total | ${C.ix} interactive | ${C.svg} kept on their drawn SVG | ${C.err} failed | ${C.stable} redraw identically`);
console.log('   failed     :', [...new Set(r.cc.filter(x=>x.err).map(x=>x.err))].slice(0,3).join(' | ')||'-');
console.log('page/console errors:', errs.length);
