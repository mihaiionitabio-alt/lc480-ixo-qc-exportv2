import sys
from pathlib import Path
src=Path(sys.argv[1]); dst=Path(sys.argv[2]); support=Path(sys.argv[3])
s=src.read_text(encoding='utf-8'); code=support.read_text(encoding='utf-8')
def rep(old,new,label):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f'ANCHOR {n}: {label}')
    s=s.replace(old,new,1)
# file picker
rep('accept=".ixo,.eds,.edt,.zip"','accept=".ixo,.eds,.edt,.rdml,.zip"','file accept')
# ZIP intake probe before ordinary embedded file probe
old='''        const entries=await readZip(ab,archive,/\\.(ixo|eds|edt)$/i);\n        if(!entries.length)errors.push(`${f.name}: contains no .ixo or .eds entries`);'''
new='''        /* An RDML file is a ZIP holding rdml_data.xml; recognise a renamed export. */\n        const rprobe=await readZip(ab,archive,/^rdml_data\\.xml$/i);\n        if(rprobe.length){accepted.push({name:f.name.replace(/\\.zip$/i,".rdml"),path:f.name,bytes,archive:null,zip:null,kind:"rdml"});continue;}\n        const entries=await readZip(ab,archive,/\\.(ixo|eds|edt)$/i);\n        if(!entries.length)errors.push(`${f.name}: contains no .ixo, .eds or .rdml entries`);'''
rep(old,new,'ZIP RDML probe')
# direct extension branch
old='''    }else if(isEdsName(f.name)){\n      accepted.push({name:f.name,path:f.name,bytes,archive:null,zip:null,kind:"eds"});\n    }else errors.push(`${f.name}: not an .ixo, .eds, .edt or .zip file`);'''
new='''    }else if(isEdsName(f.name)){\n      accepted.push({name:f.name,path:f.name,bytes,archive:null,zip:null,kind:"eds"});\n    }else if(/\\.rdml$/i.test(f.name)){\n      accepted.push({name:f.name,path:f.name,bytes,archive:null,zip:null,kind:"rdml"});\n    }else errors.push(`${f.name}: not an .ixo, .eds, .edt, .rdml or .zip file`);'''
rep(old,new,'direct RDML extension')
# decoder branch before normal source selection
old='''    try{const source=s.kind==="eds"?s:{...s,text:s.text||new TextDecoder("utf-8").decode(s.bytes)};\n      const r=source.kind==="eds"?await decodeEds(source):await decodeIxo(source,"auto");\n      validateRunBoundary(r,s.name);await ccExtractOnLoad(r,source);if(token!==APP_STATE.generation)return appReadSuperseded(msg);RUNS.push(r);}\n'''
new='''    try{\n      if(s.kind==="rdml"){\n        const entries=await rdmlEntries(s.bytes.buffer,s.archive);\n        if(!rdmlIsContainer(entries))throw new Error(`${s.name}: not an RDML container (no rdml_data.xml)`);\n        const ent=entries.find(e=>/^rdml_data\\.xml$/i.test(e.name));\n        const produced=rdmlParse(new TextDecoder().decode(ent.bytes),s.name,s.bytes);\n        produced.forEach(r=>{validateRunBoundary(r,s.name);RUNS.push(r);});\n      }else{\n        const source=s.kind==="eds"?s:{...s,text:s.text||new TextDecoder("utf-8").decode(s.bytes)};\n        const r=source.kind==="eds"?await decodeEds(source):await decodeIxo(source,"auto");\n        validateRunBoundary(r,s.name);await ccExtractOnLoad(r,source);RUNS.push(r);\n      }\n      if(token!==APP_STATE.generation)return appReadSuperseded(msg);}\n'''
rep(old,new,'RDML decode branch')
# priority before assign roles
old='''  assignRoles(RUNS);\n  sopMaybeSelectScDefault();'''
new='''  const priority=applyRawFilePriority(RUNS);\n  if(priority.superseded.length)appNotice("rdml",`${priority.superseded.length} exchange export(s) superseded by the instrument's own file`);\n  assignRoles(RUNS);\n  sopMaybeSelectScDefault();'''
rep(old,new,'RDML priority')
# SOP gate
rep('''function sopEvaluateRun(run,ri){\n  const applicability=sopRunApplicability(run);''','''function sopEvaluateRun(run,ri){\n  const processing=sopProcessingApplicability(run);\n  const applicability=processing.applicable?sopRunApplicability(run):processing;''','SOP processing gate')
# raw RDML scans should not be treated as missing-Cq findings
rep('''  if(!quantChannels(run).size)return [];\n  const results=[...(run.wells||[]),''','''  if(!quantChannels(run).size)return [];\n  if(typeof runProcessingState==="function"&&runProcessingState(run).state==="raw")return [];\n  const results=[...(run.wells||[]),''','raw RDML rising guard')
# insert support code before final DOMContentLoaded listener
marker='document.addEventListener("DOMContentLoaded",boot);'
if s.count(marker)!=1: raise SystemExit(f'ANCHOR {s.count(marker)}: boot listener')
s=s.replace(marker,code+'\n\n'+marker,1)
dst.write_text(s,encoding='utf-8')
print('ok',len(s))
