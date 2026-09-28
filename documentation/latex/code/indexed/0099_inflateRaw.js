async function inflateRaw(u8){
  if(typeof DecompressionStream==="undefined")throw new Error("This browser lacks DecompressionStream; use a current Chrome, Edge, Firefox or Safari.");
  const ds=new DecompressionStream("deflate-raw");
  const out=await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(out);
}
