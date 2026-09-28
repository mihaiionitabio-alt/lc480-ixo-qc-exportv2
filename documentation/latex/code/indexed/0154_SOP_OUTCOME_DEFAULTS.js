const SOP_OUTCOME_DEFAULTS={
  "Positive":{label:"Detected",colour:"#dc2626",text:"{target} detected (mean Cq {cq}; {det}/{n} replicates)"},
  "Negative":{label:"Not detected",colour:"#64748b",text:"{target} not detected ({n} replicates; Cq cut-off {cutoff})"},
  "Inconclusive":{label:"Inconclusive",colour:"#d97706",text:"{target} inconclusive: {reason}"},
  "Repeat":{label:"Repeat analysis",colour:"#7c3aed",text:"{target}: repeat — {reason}"},
  "Invalid":{label:"Invalid result",colour:"#111827",text:"{target}: invalid — {reason}"},
  "Invalid run":{label:"Invalid run",colour:"#9f1239",text:"Run not accepted — {reason}"},
  "Control pass":{label:"Control accepted",colour:"#16a34a",text:"{sample} / {target}: control accepted"},
  "Control fail":{label:"Control failed",colour:"#e11d48",text:"{sample} / {target}: control FAILED — {reason}"},
  "Standard":{label:"Standard",colour:"#0891b2",text:"{sample} / {target}: standard"},
  "Not interpreted":{label:"Not interpreted",colour:"#cbd5e1",text:"{target}: not interpreted"}
};
