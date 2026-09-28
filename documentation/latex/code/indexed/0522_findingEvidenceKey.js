function findingEvidenceKey(e){
  return String(e&&e.evidence||"").toLowerCase().replace(/\s+/g," ").trim()
    .replace(/\b[a-h](?:[0-9]|1[0-9]|2[0-4])\b/gi,"<well>");
}
