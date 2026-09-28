function ccSetCfg(id,patch){SOP.controlCharts=SOP.controlCharts||{};
  SOP.controlCharts[id]=Object.assign({},SOP.controlCharts[id]||{},patch);sopChanged();}