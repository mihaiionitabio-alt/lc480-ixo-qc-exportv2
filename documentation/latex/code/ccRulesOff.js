const CC_RULES_OFF=new Set(["bg_median","plateau_median","exposure","run_minutes","edit_delay","lamp_drift","cycle_sd"]);
function ccCfg(id){const c=((SOP.controlCharts||{})[id])||{},base=CC_RULES_OFF.has(id)?{r2:false,r3:false,r4:false,r5:false}:{};
