function showReviewSheet(name){
  $$("#review-tabs button").forEach(b=>b.classList.toggle("on",b.dataset.review===name));
  $$(".review-sheet").forEach(s=>s.classList.toggle("on",s.dataset.reviewSheet===name));
  renderReviewSheetLazy(name);
  localizeDOM(document.querySelector("#tab-review"));
}
