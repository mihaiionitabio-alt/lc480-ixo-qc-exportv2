/* Material for the chapters that describe the console and the two modes:
 * taken from the running page so the document cannot drift from the code. */
const { chromium } = require('playwright');
const fs=require('fs'),path=require('path');
const corpus=fs.readdirSync('corpus').sort().map(f=>path.resolve('corpus',f));
(async()=>{
 const b=await chromium.launch();
 const p=await (await b.newContext({viewport:{width:1500,height:950}})).newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message.split('\n')[0]));
 await p.goto('file://'+path.resolve('prod.html'));
 await p.evaluate(()=>document.querySelector('nav button[data-tab="load"]').click());
 await p.setInputFiles('#file',corpus);
 await p.waitForFunction(()=>!document.querySelector('#read').disabled,null,{timeout:120000});
 await p.click('#read');
 await p.waitForFunction(()=>/Read \d+ run/.test(document.querySelector('#readmsg').innerText),null,{timeout:600000});
 const out=await p.evaluate(()=>{
  const R={};
  /* console */
  R.consoleViews=Object.keys(MG_VIEWS).map(k=>{
    let items=[];try{const v=MG_VIEWS[k];items=(typeof v==='function'?v():v.build())||[];}catch(e){items=[];}
    const kinds={};items.forEach(i=>kinds[i.kind]=(kinds[i.kind]||0)+1);
    const sev={};items.forEach(i=>sev[i.sev]=(sev[i.sev]||0)+1);
    const first=items[0]||{};
    return {view:k,n:items.length,kinds,sev,
      sample:{code:first.code||'',title:first.title||'',value:String(first.value||''),unit:first.unit||'',
              kindWord:first.kindWord||'',state:String(first.state||'').slice(0,200),
              rows:(first.rows||[]).slice(0,6)}};
  });
  R.pictograms=Object.entries(typeof MG_PICT==='object'?MG_PICT:{}).map(([k,v])=>({key:k,glyph:String(v)}));
  R.consoleActions=(function(){const s=new Set();Object.keys(MG_VIEWS).forEach(k=>{
    try{const v=MG_VIEWS[k];((typeof v==='function'?v():v.build())||[]).forEach(i=>(i.actions||[]).forEach(a=>s.add(a.label+' — '+a.cmd)));}catch(e){}});
    return [...s];})();
  R.consoleCommands=(typeof MG_COMMANDS!=='undefined'?MG_COMMANDS:[]).map(c=>({id:c.id||'',pattern:String(c.re||'').replace(/^\//,'').replace(/\/$/,'')}));
  /* the two modes */
  R.cmdHelp=CMD_HELP.map(x=>({command:x[0],meaning:x[1]}));
  R.catalogue=selCatalogue().map(x=>({id:x.id,kind:x.kind,group:x.group,title:x.title,
     note:x.note||'',available:x.ready()?'yes':'no'}));
  R.templateHead=selCsvTemplate().split('\n').slice(0,4);
  /* an illustrative report over one run */
  SEL_STATE.ids=new Set(['img:curves','data:cq_values','data:runs_and_qc']);
  sopLab().name='Laboratory of molecular biology';sopLab().analyst='A. Analyst';
  R.exampleSelection=[...SEL_STATE.ids];
  R.exampleCq=allWellRows().slice(0,10);
  R.exampleRuns=reviewRunRows(reviewForensicEvents()).slice(0,6);
  R.state={runs:RUNS.length,wells:RUNS.reduce((a,r)=>a+(r.wells||[]).length,0),files:RUNS.map(r=>r.file)};
  R.statusBar=[...document.querySelectorAll('#statusbar .sb-right button')].map(x=>({id:x.id,label:x.textContent.trim()}));
  return R;
 });
 out.pageErrors=errs;
 fs.writeFileSync('docdata.json',JSON.stringify(out,null,1));
 console.log('console views',out.consoleViews.map(v=>v.view+':'+v.n).join(' '));
 console.log('catalogue',out.catalogue.length,'commands',out.cmdHelp.length,'pictograms',out.pictograms.length);
 console.log('console commands',out.consoleCommands.length,'actions',out.consoleActions.length);
 console.log('pageErrors',errs.length);
 await b.close();
})();
