function metadataId(run,index){
  const key=sourceUidOf(run)||sourceSHA256Of(run)||run.file||String(index+1);
  return `#dataset-${encodeURIComponent(String(key).replace(/[^\w.-]+/g,"-"))}`;
}
