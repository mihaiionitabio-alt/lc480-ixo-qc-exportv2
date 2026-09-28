function rdmlStem(name){
  return String(name||"").replace(/\.[^.]+$/,"").replace(/[\s_-]+/g," ").trim().toLowerCase();
}
