async function inflate(bytes,format){
  if(typeof DecompressionStream!=="function")
    throw new Error("This browser does not support DecompressionStream. Open the page in a current Chrome, Edge, Firefox or Safari release.");
  return new Uint8Array(await new Response(new Blob([bytes]).stream()
    .pipeThrough(new DecompressionStream(format))).arrayBuffer());
}
