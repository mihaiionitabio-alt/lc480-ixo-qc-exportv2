function runAt(selectId,fallback){
  const sel=$(selectId),i=sel?Number(sel.value):fallback;
  return RUNS[Number.isFinite(i)?i:0]||null;
}
