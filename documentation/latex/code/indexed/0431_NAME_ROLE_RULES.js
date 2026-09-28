const NAME_ROLE_RULES=[
  {role:"NTC",             re:/\b(ntc|no\s*template|blank\s*pcr|h2o|water)\b/i},
  {role:"Blank",           re:/\b(blank|ebc|extraction\s*blank)\b/i},
  {role:"Negative control",re:/\b(neg(ative)?(\s*control)?|nc|cn|nk)\b/i},
  {role:"Positive control",re:/\b(pos(itive)?(\s*control)?|pc|pk)\b/i},
  {role:"Calibrator",      re:/\b(cal(ibrator)?|crm|erm)\b/i},
  {role:"Standard",        re:/\b(std|standard|s[1-9]\b)/i}
];
