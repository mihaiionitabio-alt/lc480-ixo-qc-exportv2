function controlRootKey(name){
  return controlRootName(name).normalize("NFKC").replace(/\s+/g," ").trim().toLocaleUpperCase();
}
