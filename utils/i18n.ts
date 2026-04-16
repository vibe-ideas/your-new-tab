export type Language = 'zh-CN' | 'en';

export interface TranslationKeys {
  // Title
  title: string;
  
  // Option labels
  useDefaultBookmarks: string;
  useDirectJson: string;
  bookmarksJson: string;
  bookmarksUrl: string;
  
  // Button text
  save: string;
  reset: string;
  test: string;
  format: string;
  minify: string;
  refreshBookmarks: string;
  
  // Status messages
  saved: string;
  resetToDefault: string;
  urlAccessible: string;
  urlNotAccessible: string;
  jsonValid: string;
  jsonInvalid: string;
  jsonShouldBeArray: string;
  formatted: string;
  formatFailed: string;
  minified: string;
  minifyFailed: string;
  bookmarksRefreshed: string;
  usingDefaultBookmarks: string;
  usingDirectJson: string;
  usingUrl: string;
  
  // Placeholder text
  urlInputPlaceholder: string;
  jsonInputPlaceholder: string;
  urlInputTip: string;
  defaultBookmarksDescription: string;
  directJsonDescription: string;
  urlBookmarksDescription: string;
  
  // Configuration info
  currentConfig: string;
  builtInBookmarks: string;
  directJsonLabel: string;
  urlLabel: string;
  // Search provider related
  selectSearchProviderLabel: string;
  copiedToClipboard: string;
}

const translations: Record<Language, TranslationKeys> = {
  'zh-CN': {
    // Title
    title: '书签配置',
    
    // Option labels
    useDefaultBookmarks: '使用内置书签',
    useDirectJson: '直接粘贴书签 JSON',
    bookmarksJson: '书签 JSON:',
    bookmarksUrl: '书签 JSON URL:',
    
    // Button text
    save: '保存',
    reset: '重置',
    test: '测试',
    format: '格式化',
    minify: '压缩',
    refreshBookmarks: '刷新书签',
    
    // Status messages
    saved: '已保存',
    resetToDefault: '已重置为默认 URL',
    urlAccessible: 'URL 可访问',
    urlNotAccessible: 'URL 无法访问',
    jsonValid: 'JSON 格式正确',
    jsonInvalid: 'JSON 格式错误',
    jsonShouldBeArray: 'JSON 格式错误: 书签数据应该是数组',
    formatted: 'JSON 已格式化',
    formatFailed: '格式化失败',
    minified: 'JSON 已压缩',
    minifyFailed: '压缩失败',
    bookmarksRefreshed: '书签已刷新',
    usingDefaultBookmarks: '已设置为使用内置书签',
    
    // Placeholder text
    urlInputPlaceholder: '输入书签 JSON 文件的 URL',
    jsonInputPlaceholder: '粘贴完整的书签 JSON 数据',
    urlInputTip: '💡 提示：输入包含书签数据的 JSON 文件 URL，支持跨域访问',
    
    // Description info
    defaultBookmarksDescription: '使用精选的开发者书签：ShanSan、VS Code、Telegram、daily.dev、GitHub、Stack Overflow 等',
    directJsonDescription: '使用直接粘贴的 JSON 数据',
    urlBookmarksDescription: '配置书签 JSON 文件的 URL',
    
    // Configuration info
    currentConfig: '当前配置：',
    builtInBookmarks: '🔖 内置书签',
    directJsonLabel: '📋 直接 JSON',
    urlLabel: '🌐 ',
    usingDirectJson: '已设置为使用直接 JSON',
    usingUrl: '已设置为使用 URL'
    ,
    // Search provider
    selectSearchProviderLabel: '选择搜索提供商',
    copiedToClipboard: '已复制查询内容到剪贴板，请在目标站点粘贴并搜索'
  },
  'en': {
    // Title
    title: 'Bookmarks Configuration',
    
    // Option labels
    useDefaultBookmarks: 'Use Built-in Bookmarks',
    useDirectJson: 'Paste Bookmarks JSON Directly',
    bookmarksJson: 'Bookmarks JSON:',
    bookmarksUrl: 'Bookmarks JSON URL:',
    
    // Button text
    save: 'Save',
    reset: 'Reset',
    test: 'Test',
    format: 'Format',
    minify: 'Minify',
    refreshBookmarks: 'Refresh Bookmarks',
    
    // Status messages
    saved: 'Saved',
    resetToDefault: 'Reset to default URL',
    urlAccessible: 'URL is accessible',
    urlNotAccessible: 'URL is not accessible',
    jsonValid: 'JSON format is valid',
    jsonInvalid: 'JSON format error',
    jsonShouldBeArray: 'JSON format error: Bookmarks data should be an array',
    formatted: 'JSON formatted',
    formatFailed: 'Format failed',
    minified: 'JSON minified',
    minifyFailed: 'Minify failed',
    bookmarksRefreshed: 'Bookmarks refreshed',
    usingDefaultBookmarks: 'Set to use built-in bookmarks',
    
    // Placeholder text
    urlInputPlaceholder: 'Enter URL of bookmarks JSON file',
    jsonInputPlaceholder: 'Paste complete bookmarks JSON data',
    urlInputTip: '💡 Tip: Enter URL of JSON file containing bookmarks data, supports cross-domain access',
    
    // Description info
    defaultBookmarksDescription: 'Use curated developer bookmarks: ShanSan, VS Code, Telegram, daily.dev, GitHub, Stack Overflow, etc.',
    directJsonDescription: 'Use directly pasted JSON data',
    urlBookmarksDescription: 'Configure URL of bookmarks JSON file',
    
    // Configuration info
    currentConfig: 'Current configuration:',
    builtInBookmarks: '🔖 Built-in Bookmarks',
    directJsonLabel: '📋 Direct JSON',
    urlLabel: '🌐 ',
    usingDirectJson: 'Set to use direct JSON',
    usingUrl: 'Set to use URL'
    ,
    // Search provider
    selectSearchProviderLabel: 'Select search provider',
    copiedToClipboard: 'Query copied to clipboard. Paste it in the target site and search.'
  }
};

class I18n {
  private currentLanguage: Language = 'zh-CN';
  
  constructor() {
    // Get saved language setting from localStorage, default to Chinese
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'zh-CN' || savedLanguage === 'en')) {
      this.currentLanguage = savedLanguage;
    } else {
      // Detect browser language
      const browserLanguage = navigator.language.toLowerCase();
      if (browserLanguage.startsWith('en')) {
        this.currentLanguage = 'en';
      } else {
        this.currentLanguage = 'zh-CN';
      }
      this.saveLanguage();
    }
  }
  
  setLanguage(language: Language) {
    this.currentLanguage = language;
    this.saveLanguage();
  }
  
  getLanguage(): Language {
    return this.currentLanguage;
  }
  
  t(key: keyof TranslationKeys): string {
    return translations[this.currentLanguage][key];
  }
  
  private saveLanguage() {
    localStorage.setItem('language', this.currentLanguage);
  }
  
  // Get all supported languages
  getSupportedLanguages(): Language[] {
    return ['zh-CN', 'en'];
  }
  
  // Get language display name
  getLanguageDisplayName(language: Language): string {
    const names = {
      'zh-CN': '简体中文',
      'en': 'English'
    };
    return names[language];
  }
}

// Create global singleton instance
export const i18n = new I18n();

// Export a convenient translation function
export const t = (key: keyof TranslationKeys): string => {
  return i18n.t(key);
};
