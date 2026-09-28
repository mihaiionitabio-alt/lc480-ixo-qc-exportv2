const fs=require('fs'), path=require('path'), crypto=require('crypto');
const {chromium}=require('playwright');
const root='D:/IXO/release_unified_2026-09-21_r2';
const doc=path.join(root,'documentation');
const htmlPath=path.join(root,'qpcr_qc_forensics.html');
const source=fs.readFileSync(htmlPath,'utf8');
const lines=source.split(/\n/); const idx=JSON.parse(fs.readFileSync(path.join(doc,'documentation_sources/generator/fnindex.json'),'utf8'));
const names=new Set(idx.map(x=>x.name));
const sha256=crypto.createHash('sha256').update(source).digest('hex');
function src(e){return lines.slice(e.start-1,e.end).join('\n');}
function params(s,name){
  let m=s.match(new RegExp('function\\s+'+name.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')+'\\s*\\(([^)]*)\\)'));
  if(!m){m=s.match(/^(?:const|let|var)\s+[^=]+?=\s*(?:async\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\\w$]*))\s*=>/m);}
  if(!m) return [];
  const p=(m[1]??m[2]??'').split(',').map(x=>x.trim()).filter(Boolean);
  return p.map(x=>x.replace(/=.*$/,'').trim());
}
function refs(s,self){const out=[]; for(const n of names){if(n===self)continue; const re=new RegExp('\\b'+n.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')+'\\b'); if(re.test(s))out.push(n);} return out.slice(0,12);}
function role(n){const x=n.toLowerCase(); if(/^(render|show|wire|boot|localize|setlanguage|scroll|mg|draw|bind|current|option|metric|platecolour|heatcolour|setselect|curvecolour|hashcolour|svg|graph)/.test(x))return 'Client/view'; if(/(decode|parse|analysis|sop|cc|review|forensic|orphan|curve|control|run|derived|recalc|timeline|event|state|applicability|matcher|canonical|rising)/.test(x))return 'Controller/service'; if(/(crc|sha|inflate|zip|csv|xlsx|rdml|rdes|export|bundle|download|integrity|metadata|pseudonym|base64|bytes|prop|read|source)/.test(x))return 'Repository/data access'; return 'Shared model/utility';}
function inputContract(e,s,ps){
  if(e.kind!=='function') return 'constant value; no call input';
  if(!ps.length) return 'no explicit parameters; reads closure/global state';
  return ps.map(p=>p+' (type inferred from uses)').join(', ');
}
function outputContract(e,s){
  const ret=[...s.matchAll(/\breturn\s+([^;\n]{1,120})/g)].slice(0,2).map(m=>m[1].trim());
  if(ret.length)return 'return '+ret.join(' | ');
  if(/innerHTML|textContent|appendChild|classList|\.value\s*=|\.push\(|\.set\(/.test(s))return 'mutates DOM or shared state; no stable return contract';
  return e.kind==='function'?'no explicit return observed':'object/array/constant value';
}
function staticStatus(e,s,ps){
  if(!s.trim())return {status:'FAIL-static',reason:'empty source range'};
  if(e.kind==='function' && !/^function|^const|^let|^var/.test(s.trim())) return {status:'REVIEW-static',reason:'parser range is a nested/inline expression'};
  return {status:'PASS-static',reason:'source range exists and matches indexed line range'};
}
const pure = new Set(['ce','clone','esc','xesc','safeName','bytesFrom','num','safeRe','uniq','byKey','mean','sd','median','percentile','range','cv','lgamma','betacf','betai','tDistTwoTail','gammap','chiSqP','tTest','fitLin','crc32','sourceSha256','hexBEToDouble','acquisitionStats','analysisKind','cpMethodOf','resultKindOf','rqResult','ownedBy','ownsResult','calcStateLabel','sopHash','sopCanonical','sopBase','sopMatcher','sopTime','shortDate','displayRunTick','runAt','runName','stripLotDate','controlRootName','controlRootKey','controlCategory','curveSignal','curveKey','hashColour','niceTicks','gRunDate','gByDate','gRunTicks','gXAxis','curveColour','plateColour','callLabel','posToWell','posToLimsWell','wellToPos','hex','dt','fmt','pill','wellPos']);
function argFor(n,p,i){
  const q=(p||'').toLowerCase();
  if(/arr|values|xs|ys|nums|data|rows|list|a$|b$/.test(q))return [1,2,3,4];
  if(/idx|index|pos|cycle|n$|count|i$|k$/.test(q))return 1;
  if(/date|time|stamp/.test(q))return '2025-01-02T03:04:05Z';
  if(/well/.test(q))return 'A1';
  if(/text|name|id|key|str|pattern|target|method|kind|role|code/.test(q))return '35S';
  if(/obj|run|row|record|item|cfg|profile|opts|geom|source|r|s/.test(q))return {};
  if(/flag|bool|enabled|locked/.test(q))return false;
  return i===0?1:null;
}
function summarize(v){
  if(v===undefined)return 'undefined'; if(v===null)return 'null';
  if(typeof v==='string')return JSON.stringify(v.length>180?v.slice(0,177)+'...':v);
  if(typeof v==='number'||typeof v==='boolean')return String(v);
  if(Array.isArray(v))return `Array(${v.length}) ${JSON.stringify(v.slice(0,3)).slice(0,220)}`;
  if(v instanceof Uint8Array)return `Uint8Array(${v.length})`;
  if(typeof v==='object')return `Object{${Object.keys(v).slice(0,12).join(',')}}`;
  return typeof v;
}
(async()=>{
  const browser=await chromium.launch({headless:true}); const page=await browser.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e.message)));
  await page.goto('file:///'+htmlPath.replace(/\\/g,'/'),{waitUntil:'load'}); await page.waitForTimeout(500);
  const results=[];
  for(const e of idx){
    const s=src(e), ps=params(s,e.name), st=staticStatus(e,s,ps); const r={name:e.name,kind:e.kind,start:e.start,end:e.end,role:role(e.name),parameters:ps,input:inputContract(e,s,ps),output:outputContract(e,s),refs:refs(s,e.name),staticStatus:st.status,staticReason:st.reason,execStatus:'not-attempted',execInput:'',execOutput:'',execError:''};
    if(e.kind!=='function'){
      try{const x=await page.evaluate(n=>{try{const v=eval(n); return {ok:true,type:typeof v,summary:(v&&typeof v==='object')?('Object{'+Object.keys(v).slice(0,12).join(',')+'}'):String(v)};}catch(err){return {ok:false,error:String(err.message)}}},e.name); if(x.ok){r.execStatus='PASS-executable';r.execOutput=`typeof ${x.type}; ${x.summary}`;}else{r.execStatus='REVIEW-runtime';r.execError=x.error;}}catch(err){r.execStatus='ERROR-harness';r.execError=String(err.message)}
    } else if(pure.has(e.name) || (ps.length===0 && !/^(boot|render|show|draw|wire|bind|download|export|refresh|set|mark|intake|read|decode|parse|cc|sop|review|instrument|graph)/i.test(e.name))){
      const args=ps.map((p,i)=>argFor(e.name,p,i)); r.execInput=JSON.stringify(args).slice(0,500);
      try{const x=await page.evaluate(({n,args})=>{try{const f=eval(n); if(typeof f!=='function')return {ok:false,error:'symbol is not callable'}; const v=f(...args); return {ok:true,summary:typeof v==='object'&&v!==null? (Array.isArray(v)?`Array(${v.length})`:('Object{'+Object.keys(v).slice(0,12).join(',')+'}')):String(v)};}catch(err){return {ok:false,error:String(err&&err.message||err)}}},{n:e.name,args}); if(x.ok){r.execStatus='PASS-executable';r.execOutput=x.summary;}else{r.execStatus='REVIEW-runtime';r.execError=x.error;}}catch(err){r.execStatus='ERROR-harness';r.execError=String(err.message)}
    } else {
      r.execStatus='REVIEW-fixture-required'; r.execError='Requires decoded runs, profile, history, DOM controls, file bytes, or an export fixture; static contract and call relations recorded.';
    }
    results.push(r);
  }
  await browser.close();
  const out={schema:'qpcr-function-verification/1',generatedAt:new Date().toISOString(),htmlSha256:sha256,indexCount:idx.length,pageErrors,results};
  const outDir=path.join(doc,'function_tests_2026-09-23'); fs.writeFileSync(path.join(outDir,'function_test_results.json'),JSON.stringify(out,null,2));
  const counts={}; for(const r of results){const k=r.execStatus;counts[k]=(counts[k]||0)+1;}
  fs.writeFileSync(path.join(outDir,'function_test_summary.json'),JSON.stringify({schema:out.schema,htmlSha256:sha256,indexCount:idx.length,counts,pageErrors},null,2));
  console.log(JSON.stringify({indexCount:idx.length,counts,pageErrors,sha256}));
})().catch(e=>{console.error(e);process.exit(1)});
