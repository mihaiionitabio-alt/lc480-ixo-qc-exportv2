function websiteSource(lang){
  const source=CLEAN_PAGE_SOURCE||("<!doctype html>\n"+document.documentElement.outerHTML);
  return source.replace(/const DEFAULT_LANG="(?:en|zh)";/,`const DEFAULT_LANG="${lang==="zh"?"zh":"en"}";`);
}
