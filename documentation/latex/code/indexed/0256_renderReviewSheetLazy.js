function renderReviewSheetLazy(name){
  if(DIRTY.has("review"))return renderTab("review");
  if(!DIRTY.has("review:"+name))return;DIRTY.delete("review:"+name);
  try{REVIEW_RENDERERS[name]&&REVIEW_RENDERERS[name]();}catch(e){console.error(e);}
}
