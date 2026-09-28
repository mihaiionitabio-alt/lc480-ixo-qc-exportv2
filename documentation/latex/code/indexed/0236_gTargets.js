function gTargets(run){return uniq((run.wells||[]).map(w=>w.target||w.analysis).filter(Boolean));}
