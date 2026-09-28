function renderMachineMetadata(){
  const node=$("#machine-metadata");
  if(node)node.textContent=machineMetadataJSON();
}
