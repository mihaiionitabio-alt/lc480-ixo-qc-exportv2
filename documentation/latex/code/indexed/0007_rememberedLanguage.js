function rememberedLanguage(){try{return localStorage.getItem(languageStorageKey())||DEFAULT_LANG;}catch{return DEFAULT_LANG;}}
