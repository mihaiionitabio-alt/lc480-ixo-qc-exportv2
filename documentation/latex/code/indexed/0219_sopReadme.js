function sopReadme(){
  return `SOP interpretation export
Generated: ${new Date().toISOString()}
Profile: ${SOP.name}  version ${SOP.version}
Author / approver: ${SOP.author||"-"}
Profile SHA-256 (canonical JSON, without the sha256 field): ${sopHash()}
Runs: ${RUNS.map(r=>`${runName(r)} (source SHA-256 ${(r.meta||{}).sourceSHA256||"-"})`).join("\n      ")}

The stored Cq values, calls and fluorescence were not changed. Each outcome was
produced by applying the profile in sop_profile.json to the stored values; the
column "rule" names the profile row that applied and "reason" says why.
Sample names ${pseudoOn()?"are pseudonymised (the mapping is not part of this bundle)":"are the stored names"}.
`;
}
