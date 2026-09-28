function assignRoles(runs){
  runs.forEach(run=>{
    const touch=w=>{
      const byInstrument=w.instrRole||"";
      const byName=roleFromName(w.sample);
      w.roleInstrument=byInstrument;
      w.roleName=byName;
      /* The instrument's types are coarse: a no-template control and a matrix
         negative are both written as qsNegative. Where the name is more
         specific WITHIN the same family, the name refines the type rather than
         contradicting it - and the distinction matters, because an NTC must be
         silent in every analysis while a matrix negative must still amplify for
         a reference gene. Outside the family the instrument still wins. */
      const refine=byInstrument&&byName!=="Unknown"
        &&NEGATIVE_FAMILY.includes(byInstrument)&&NEGATIVE_FAMILY.includes(byName)
        &&byInstrument!==byName;
      w.role=refine?byName:(byInstrument&&byInstrument!=="Unknown"?byInstrument:byName);
      w.roleSource=refine?"instrument sample type, refined by the name"
        :(byInstrument&&byInstrument!=="Unknown"?"instrument sample type":"sample name");
      w.roleDisagrees=!!(byInstrument&&byInstrument!=="Unknown"&&byName!=="Unknown"
        &&byInstrument!==byName
        &&!(NEGATIVE_FAMILY.includes(byInstrument)&&NEGATIVE_FAMILY.includes(byName)));
    };
    run.wells.forEach(touch);
    (run.tmWells||[]).forEach(touch);
  });
  return runs;
}
