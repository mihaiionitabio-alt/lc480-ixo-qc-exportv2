function download(name,data,mime){
  const blob=data instanceof Blob?data:new Blob([data],{type:mime||"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
}
