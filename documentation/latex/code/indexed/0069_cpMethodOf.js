function cpMethodOf(name,cls){
  if(/2nd\s*deriv/i.test(name||""))return "2nd Derivative Maximum";
  if(/fit\s*point/i.test(name||""))return "Fit Points";
  if(/FitPoints/i.test(cls||""))return "Fit Points";
  if(/Absolute\s*Quantification/i.test(cls||""))return "2nd Derivative Maximum";
  return "";
}
