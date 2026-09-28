function bytesFrom(data){return data instanceof Uint8Array?data:(typeof data==="string"?textEncoder.encode(data):new Uint8Array(data));}
