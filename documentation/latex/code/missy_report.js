async function selBuildReport(){
  const chosen=selSelected();
  if(!chosen.length)throw new Error("nothing is selected");
  const doc=pdfDoc();
  const coverMark=await svgToJpeg(missySvg(false),2);
  if(coverMark){const mw=Math.min(120,doc.width),mh=mw*coverMark.natH/coverMark.natW;doc.room(mh+8);doc.image(coverMark.bytes,mw,mh,coverMark.w,coverMark.h);}
  doc.text(selReportTitle(),20,true);
  doc.gap(4);doc.rule();doc.gap(6);
  const meta=[
    ["Laboratory",sopLabName()||"not stated"],
    ["Analysis by",sopAnalystName()||"not stated"],
    ["Profile",SOP.name+"  v"+SOP.version],
    ["Profile checksum","sha256:"+sopHash()],
    ["Built",new Date().toISOString().replace("T"," ").slice(0,19)+" UTC"],
    ["Runs loaded",RUNS.length?RUNS.map(runName):["none"]],
    ["Items selected",String(chosen.length)]
  ];
  const labelW=120,valueW=doc.width-labelW,size=10,line=size*1.32;
  meta.forEach(([k,v])=>{
    const values=Array.isArray(v)?(v.length?v.map(String):["none"]):[String(v==null?"none":v)];
    const lines=values.flatMap(x=>pdfWrap(x,valueW,size,false));
    doc.room(line*lines.length+4);
    doc.text(k,size,true);doc.y+=line;
    lines.forEach(x=>doc.text(x,size,false,labelW));
  });
  doc.gap(10);doc.rule();doc.gap(4);
  doc.para("Values in this report are the values the instrument software stored. The page recomputes nothing. "
    +"This is not a validated laboratory report and does not replace the laboratory's own record.",9,false);
  doc.gap(8);
  doc.text("Contents",12,true);
  chosen.forEach((x,i)=>{doc.room(12);doc.text((i+1)+".  "+x.title+"   ["+x.id+"]",9.5,false);});

  for(const x of chosen){
    doc.page();
    doc.text(x.title,14,true);
    doc.gap(2);
    if(x.note)doc.para(x.note,9,false);
    doc.gap(4);doc.rule();doc.gap(4);
    if(x.kind==="image"){
      let f=null;
      try{f=x.figure();}catch(e){doc.para("This figure could not be drawn: "+(e&&e.message||e),9.5,false);}
      if(f){
        const jpg=await svgToJpeg(missyMarkWithSvg(f.svg,"top-right"),2);
        if(jpg){
          const w=doc.width,h=w*jpg.natH/jpg.natW;
          doc.room(h+10);
          doc.image(jpg.bytes,w,h,jpg.w,jpg.h);
        }else doc.para("This figure could not be rasterised in this browser.",9.5,false);
        if(f.rows&&f.rows.length){
          doc.gap(6);doc.text("Numbers behind this figure",11,true);doc.gap(2);
          selTableBlock(doc,f.rows);
        }
      }
    }else{
      let rows=[];
      try{rows=x.rows()||[];}catch(e){doc.para("This table could not be built: "+(e&&e.message||e),9.5,false);}
      selTableBlock(doc,rows);
    }
  }
  const bytes=doc.build();
  SEL_STATE.lastReport={bytes:bytes.length,items:chosen.length,at:new Date().toISOString()};
  return bytes;
}