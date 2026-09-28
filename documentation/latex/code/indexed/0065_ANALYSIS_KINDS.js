const ANALYSIS_KINDS=[
  [/relative\s*quantification|rel\.?\s*quant/i,"relquant","Relative Quantification"],
  [/absolute\s*quantification|abs\s*quant|fit\s*points/i,"absquant","Absolute Quantification"],
  [/end\s*-?\s*(point|pt)\s*geno/i,"endptgeno","Endpoint Genotyping"],
  [/qual[_\s-]*mut[_\s-]*detection|melt.*geno/i,"meltgeno","Melting Curve Genotyping"],
  [/high\s*resolution\s*melting|gene\s*scanning|(?:^|\s)scanning(?:\s|$)/i,"genescan","Gene Scanning"],
  [/tm\s*calling|melting\s*(temperature|curve)\s*analysis/i,"tm","Tm Calling"],
  [/colou?r\s*comp/i,"colorcomp","Color Compensation"]
];
