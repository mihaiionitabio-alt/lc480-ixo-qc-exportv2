async function sourceSha256(bytes){
  if(globalThis.crypto&&globalThis.crypto.subtle){
    try{const hash=await globalThis.crypto.subtle.digest("SHA-256",bytes);
      return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,"0")).join("");}catch(e){}
  }
  return sha256Hex(bytes);
}
