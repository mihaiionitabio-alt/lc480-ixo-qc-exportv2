function graphFileBase(){const L=GRAPH_STATE.last;if(!L)return "graph";return safeName((L.g.scope==="run"&&L.c.run?runName(L.c.run)+"_":baseName()+"_")+L.g.id+(L.c.target?"_"+L.c.target:""));}
