function stripLotDate(name){
  return String(name||"").replace(/\b\d{4}[-./]\d{1,2}[-./]\d{1,2}\b/g," ")
    .replace(/\b\d{1,2}[-./]\d{1,2}(?:[-./]\d{2,4})?\b/g," ")
    .replace(/\s+/g," ").trim()||String(name||"");
}
