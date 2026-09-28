function integrityMismatches(){
  const out=[];
  (RUNS||[]).forEach((r,i)=>{
    const g=r&&r.integrity||{}; const file=r&&r.file||(`Run ${i+1}`);
    if(g.kind==="ixo"){
      if(g.ok===false)out.push({file,type:"Object stream checksum",expected:g.stored||"stored value",actual:g.computed||"recomputed value",detail:"The file content differs from the sealed object stream."});
    }else if(g.kind==="eds"){
      if(g.zipCrcOk===false){
        const bad=(g.zipCrcBad||[]); out.push({file,type:"ZIP CRC-32",expected:"entry CRC",actual:bad.length?bad.join(", "):"mismatch",detail:"One or more archive entries failed their CRC check."});
      }
      if(g.ok===false)out.push({file,type:"Tamper MD5",expected:g.stored||"stored value",actual:g.computed||"recomputed value",detail:"The archive content differs from its stored Tamper value."});
    }
  });
  return out;
}
