async function decodeIxo(source,geomPref){
  const raw=source.text,end=raw.indexOf("</objectstream>");
  const dom=new DOMParser().parseFromString(end>=0?raw.slice(0,end+15):raw,"application/xml");
  if(dom.querySelector("parsererror"))throw new Error("XML parse error");

  /* Experiment and run provenance live at different levels. Scope each property
     so a nested object's Created/LastModified value can never be mistaken for the
     experiment's, and keep the four distinct run timestamps distinct. */
  const expObj=dom.querySelector('[class="HTCExperiment"]'),runObj=dom.querySelector('[class="HTCRun"]');
  const from=(el,k)=>pv(el,k)||propText(dom,k);
  const meta={
    name:from(expObj,"name"),UID:from(expObj,"UID"),
    Created:from(expObj,"Created"),CreatedByName:from(expObj,"CreatedByName"),
    LastModified:from(expObj,"LastModified"),LastModifiedByName:from(expObj,"LastModifiedByName"),
    SWVersion:from(expObj,"SWVersion"),AppliedTemplates:from(expObj,"AppliedTemplates"),
    State:from(expObj,"State"),Notes:from(expObj,"Notes"),
    RunCreated:from(runObj,"Created"),StartTime:from(runObj,"StartTime"),EndTime:from(runObj,"EndTime"),
    InstrumentName:from(runObj,"InstrumentName"),InstrumentVersion:from(runObj,"InstrumentVersion"),
    InstrumentID:from(runObj,"InstrumentID"),PlateID:from(runObj,"PlateID"),
    Technician:from(runObj,"Technician"),InstrCalibrationDate:from(runObj,"InstrCalibrationDate"),
    RevsComplete:from(runObj,"RevsComplete"),MacroName:from(runObj,"MacroName"),
    MacroOwner:from(runObj,"MacroOwner"),
    sourceCRC32:source.bytes?crc32(source.bytes).toString(16).padStart(8,"0"):"",
    sourceSHA256:source.bytes?await sourceSha256(source.bytes):"",
    sourceBytes:source.bytes?source.bytes.length:""
  };
  if(!meta.AppliedTemplates){const it=dom.querySelector('list[name="AppliedTemplates"] item');if(it&&it.textContent)meta.AppliedTemplates=it.textContent.trim();}
  const identities={};["Id","InstrumentID","PlateID","OwnerUID","UID","SubsetID"].forEach(k=>identities[k]=uniq(propValues(dom,k)));

  const plate=decodePlateModel(dom);
  const subsets=decodeSubsets(dom);
  const protocol=decodeProtocol(dom);
  const analyses=decodeAnalyses(dom);

  /* plate geometry: the block type is authoritative (LIMS guide, HTCBlockType RowCount/ColCount) */
  let rows,cols;
  if(protocol.block&&protocol.block.rowCount>0&&protocol.block.colCount>0){
    rows=protocol.block.rowCount;cols=protocol.block.colCount;
  }else{
    const seen=Math.max(96,...analyses.map(a=>a.maxPos||0),
      (protocol.setup&&protocol.setup.maxPositions)||0,...Object.keys(plate).map(x=>Number(x)+1));
    cols=seen>96?24:12;rows=seen>96?16:8;
  }
  if(geomPref==="96"){rows=8;cols=12;}
  else if(geomPref==="384"){rows=16;cols=24;}
  const maxPos=rows*cols;

  /* Excitation wavelength -> acquisition / plate-model channel index.
     ChannelIdx and AcquisitionStore.Channel number the ACTIVE channels in detection-format
     order. Inactive declarations do not consume an index. This matters for Roche's dual-colour
     hydrolysis demo: Cyan 500 is declared first but inactive, while FAM and Hex are stored as
     channels 0 and 1. Counting the inactive declaration loses every Hex curve and attaches the
     FAM plate properties to Hex. Sorting wavelengths remains only a last resort. */
  const ex2chan={},chanName={},exem2chan={};
  const acquisitionChannels=protocol.channels.some(c=>c.active)
    ? protocol.channels.filter(c=>c.active) : protocol.channels;
  acquisitionChannels.forEach((c,i)=>{
    if(Number.isFinite(c.ex)&&!(c.ex in ex2chan)){ex2chan[c.ex]=i;chanName[c.ex]=c.name;}
    /* Two channels can share an excitation filter (533-580 and 533-610 in the four-channel
       COVID format). The excitation/emission pair is therefore the key; excitation alone is
// … 283 more line(s): the complete code is at lines 2747–3029 of the HTML file