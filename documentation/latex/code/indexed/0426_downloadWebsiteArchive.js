function downloadWebsiteArchive(lang){
  download(lang==="zh"?"qPCR_QC_Forensics_Chinese_website.zip":"qPCR_QC_Forensics_English_website.zip",
    makeWebsiteArchive(lang),"application/zip");
}
