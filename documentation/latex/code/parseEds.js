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
// … 152 more line(s): the complete code is at lines 3236–3387 of the HTML file