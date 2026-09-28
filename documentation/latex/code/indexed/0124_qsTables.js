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
