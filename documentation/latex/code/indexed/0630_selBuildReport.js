     more than its share only gets the room the others did not use. Scaling every column
     by one factor would spend the page on whichever column happens to be widest. */
  let room=doc.width-gap*(cols.length-1);
  const widths=wid.slice();
  if(wid.reduce((a,b)=>a+b,0)>room){
    let left=room,open=cols.map((c,i)=>i);
    for(let pass=0;pass<8&&open.length;pass++){
      const share=left/open.length,done=[];
      open.forEach(i=>{if(wid[i]<=share){widths[i]=wid[i];left-=wid[i];done.push(i);}});
      if(!done.length){open.forEach(i=>{widths[i]=left/open.length;});break;}
      open=open.filter(i=>!done.includes(i));
    }
  }
  const line=(vals,bold)=>{
    doc.room(size*1.5);
    let x=0;
    vals.forEach((v,i)=>{
      doc.text(pdfFit(v,widths[i],size,bold),size,bold,x);
      doc.y+=size*1.32;                      /* stay on the line for the next column */
      x+=widths[i]+gap;
    });
    doc.y-=size*1.5;
  };
  line(cols,true);
  doc.rule();
  shown.forEach(r=>line(cols.map(c=>{
    const v=r[c];
    return typeof v==="number"?String(+v.toPrecision(6)):String(v==null?"":v);
  }),false));
  doc.gap(2);
  const left=rows.length-shown.length;
  doc.para(left>0?`${rows.length} rows in total; the first ${shown.length} are shown. The archive carries all of them.`
                 :`${rows.length} row${rows.length===1?"":"s"}.`,8,false);
  if(note)doc.para(note,8,false);
}
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
