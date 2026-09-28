/* ---------- 2 . the catalogue both modes select from ----------
   An item knows how to produce itself twice: as a figure for the report and
   as a file for the archive. Nothing is precomputed, so a selection made
   before a file is read is still valid after it. */
const SEL_STATE={ids:new Set(),options:Object.create(null),run:0,title:"",output:"pdf",lastReport:null};
function selRunIndex(){
