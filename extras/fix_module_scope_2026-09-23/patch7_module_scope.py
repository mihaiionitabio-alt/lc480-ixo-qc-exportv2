"""Scope the rising-curve scan to modules that compute a crossing.
   python3 patch7_module_scope.py qpcr_qc_forensics.html out.html
   Verified against DD82ED15...; 552 -> 13 findings on the ten vendor demos, the twelve
   laboratory screening runs and the eight QuantStudio examples unchanged."""
import sys, io
src, dst = sys.argv[1], sys.argv[2]
s = io.open(src, encoding="utf-8").read(); n0 = len(s)
def rep(old, new, label):
    global s
    if s.count(old) != 1: raise SystemExit("ANCHOR x%d: %s" % (s.count(old), label))
    s = s.replace(old, new, 1)

rep("""function orphanCurveCandidates(run){
  if(!run||!run.allCurves||!Object.keys(run.allCurves).length)return [];""",
"""/* Which analyses of this run compute a crossing at all? Endpoint genotyping reports calls,
   gene scanning reports groups, melt-curve genotyping and Tm calling report temperatures.
   In those modules a stored row without a Cq is the normal and correct state, so a
   missing-Cq finding there is noise, not evidence. */
const CQ_ANALYSIS_KINDS=/absquant|relquant/i;
function quantChannels(run){
  const set=new Set();
  (run&&run.analyses||[]).forEach(a=>{
    if(!CQ_ANALYSIS_KINDS.test(String(a.kind||"")))return;
    const c=Number(a.channelIdx);if(Number.isFinite(c))set.add(c);
  });
  return set;
}
function orphanCurveCandidates(run){
  if(!run||!run.allCurves||!Object.keys(run.allCurves).length)return [];
  /* Scope by the RUN, not by the channel. Excluding channels that no Cq analysis reads
     would re-create the blind spot of 23 September: in the three-channel COVID assay the
     channel with no analysis at all is precisely the one worth seeing, and a contamination
     finding lives there. So: skip a run that computes no crossing anywhere, and inside a
     run that does, keep looking at every channel. */
  if(!quantChannels(run).size)return [];""", "module scope")

rep("""function resultAnswers(w){
  if(resultCq(w)!==null)return "cq";
  if(w&&w.undetermined===true)return "undetermined";""",
"""function resultAnswers(w){
  if(resultCq(w)!==null)return "cq";
  if(w&&w.undetermined===true)return "undetermined";
  /* a genotype call and a melting temperature are answers in their own modules */
  if(w&&(w.kind==="genotype"||w.kind==="tm")&&((w.call&&String(w.call).trim())||Number.isFinite(Number(w.tm))))return "call";""",
"call is an answer")

io.open(dst, "w", encoding="utf-8").write(s)
print("ok", n0, "->", len(s))
