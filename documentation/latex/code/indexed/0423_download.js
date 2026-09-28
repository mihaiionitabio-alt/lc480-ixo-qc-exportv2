function download(name,text,mime){
  const blob=text instanceof Uint8Array?new Blob([text],{type:mime||"application/octet-stream"})
    :new Blob([text],{type:(mime||"text/plain")+";charset=utf-8"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),4000);
}
