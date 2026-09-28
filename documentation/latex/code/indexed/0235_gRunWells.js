function gRunWells(run,target){return (run.wells||[]).filter(w=>!target||(w.target||w.analysis)===target);}
