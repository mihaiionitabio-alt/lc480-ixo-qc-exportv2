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
async function selDownloadReport(name){
  const bytes=await selWithExportNames(selBuildReport);
