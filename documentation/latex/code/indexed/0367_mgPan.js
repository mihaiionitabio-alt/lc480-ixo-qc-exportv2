function mgPan(dx,dy){MG.panX=Math.max(-1200,Math.min(1200,MG.panX+dx));MG.panY=Math.max(-1200,Math.min(1200,MG.panY+dy));mgApplyChartView();}
