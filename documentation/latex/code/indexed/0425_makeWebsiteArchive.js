function makeWebsiteArchive(lang){
  const zh=lang==="zh",name=zh?"qPCR_QC_Forensics_中文.html":"qPCR_QC_Forensics_English.html";
  const readme=zh
    ?"qPCR 原始数据、质量控制与取证导出工具（LightCycler 480 .ixo 与 QuantStudio 3/5 .eds）\n\n解压后双击 HTML 文件即可离线使用。数据只在浏览器本机处理中，不会上传。\n中文术语依据 Roche LightCycler 480 实时荧光定量PCR仪操作说明书（软件版本 1.5）及 QuantStudio 软件的通用术语。\n"
    :"qPCR raw values, quality-control and forensic export tool (LightCycler 480 .ixo and QuantStudio 3/5 .eds)\n\nExtract the archive and open the HTML file in a browser. It works offline and does not upload experiment data.\n";
  return makeStoredZip([{name,data:websiteSource(zh?"zh":"en")},{name:zh?"使用说明.txt":"README.txt",data:readme}]);
}
