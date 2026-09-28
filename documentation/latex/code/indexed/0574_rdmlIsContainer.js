function rdmlIsContainer(entries){
  return entries.some(e=>/^rdml_data\.xml$/i.test(e.name));
}
