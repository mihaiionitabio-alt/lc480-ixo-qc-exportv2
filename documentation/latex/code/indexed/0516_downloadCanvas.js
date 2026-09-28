function downloadCanvas(canvas,name){
  if(!canvas)return;
  const a=document.createElement("a");a.download=name;a.href=canvas.toDataURL("image/png");
  document.body.appendChild(a);a.click();a.remove();
}
