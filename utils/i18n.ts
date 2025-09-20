export type Language = 'zh-CN' | 'en';

export interface TranslationKeys {
  // 标题
  title: string;
  
  // 选项标签
  useDefaultBookmarks: string;
  useDirectJson: string;
  bookmarksJson: string;
  bookmarksUrl: string;
  
  // 按钮文本
  save: string;
  reset: string;
  test: string;
  format: string;
  minify: string;
  refreshBookmarks: string;
  
  // 状态消息
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
  
  // 提示信息
  urlInputPlaceholder: string;
  jsonInputPlaceholder: string;
  urlInputTip: string;
  defaultBookmarksDescription: string;
  directJsonDescription: string;
  urlBookmarksDescription: string;
  
  // 配置信息
  currentConfig: string;
  builtInBookmarks: string;
  directJsonLabel: string;
  urlLabel: string;
}

const translations: Record<Language, TranslationKeys> = {
  'zh-CN': {
    // 标题
    title: '书签配置',
    
    // 选项标签
    useDefaultBookmarks: '使用内置书签',
    useDirectJson: '直接粘贴书签 JSON',
    bookmarksJson: '书签 JSON:',
    bookmarksUrl: '书签 JSON URL:',
    
    // 按钮文本
    save: '保存',
    reset: '重置',
    test: '测试',
    format: '格式化',
    minify: '压缩',
    refreshBookmarks: '刷新书签',
    
    // 状态消息
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
    
    // 提示信息
    urlInputPlaceholder: '输入书签 JSON 文件的 URL',
    jsonInputPlaceholder: '粘贴完整的书签 JSON 数据',
    urlInputTip: '💡 提示：输入包含书签数据的 JSON 文件 URL，支持跨域访问',
    
    // 描述信息
    defaultBookmarksDescription: '使用精选的开发者书签：ShanSan、VS Code、Telegram、daily.dev、GitHub、Stack Overflow 等',
    directJsonDescription: '使用直接粘贴的 JSON 数据',
    urlBookmarksDescription: '配置书签 JSON 文件的 URL',
    
    // 配置信息
    currentConfig: '当前配置：',
    builtInBookmarks: '🔖 内置书签',
    directJsonLabel: '📋 直接 JSON',
    urlLabel: '🌐 ',
    usingDirectJson: '已设置为使用直接 JSON',
    usingUrl: '已设置为使用 URL'
  },
  'en': {
    // 标题
    title: 'Bookmarks Configuration',
    
    // 选项标签
    useDefaultBookmarks: 'Use Built-in Bookmarks',
    useDirectJson: 'Paste Bookmarks JSON Directly',
    bookmarksJson: 'Bookmarks JSON:',
    bookmarksUrl: 'Bookmarks JSON URL:',
    
    // 按钮文本
    save: 'Save',
    reset: 'Reset',
    test: 'Test',
    format: 'Format',
    minify: 'Minify',
    refreshBookmarks: 'Refresh Bookmarks',
    
    // 状态消息
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
    
    // 提示信息
    urlInputPlaceholder: 'Enter URL of bookmarks JSON file',
    jsonInputPlaceholder: 'Paste complete bookmarks JSON data',
    urlInputTip: '💡 Tip: Enter URL of JSON file containing bookmarks data, supports cross-domain access',
    
    // 描述信息
    defaultBookmarksDescription: 'Use curated developer bookmarks: ShanSan, VS Code, Telegram, daily.dev, GitHub, Stack Overflow, etc.',
    directJsonDescription: 'Use directly pasted JSON data',
    urlBookmarksDescription: 'Configure URL of bookmarks JSON file',
    
    // 配置信息
    currentConfig: 'Current configuration:',
    builtInBookmarks: '🔖 Built-in Bookmarks',
    directJsonLabel: '📋 Direct JSON',
    urlLabel: '🌐 ',
    usingDirectJson: 'Set to use direct JSON',
    usingUrl: 'Set to use URL'
  }
};

class I18n {
  private currentLanguage: Language = 'zh-CN';
  
  constructor() {
    // 从localStorage获取保存的语言设置，默认使用中文
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'zh-CN' || savedLanguage === 'en')) {
      this.currentLanguage = savedLanguage;
    } else {
      // 检测浏览器语言
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
  
  // 获取所有支持的语言
  getSupportedLanguages(): Language[] {
    return ['zh-CN', 'en'];
  }
  
  // 获取语言显示名称
  getLanguageDisplayName(language: Language): string {
    const names = {
      'zh-CN': '简体中文',
      'en': 'English'
    };
    return names[language];
  }
}

// 创建全局单例实例
export const i18n = new I18n();

// 导出一个便捷的翻译函数
export const t = (key: keyof TranslationKeys): string => {
  return i18n.t(key);
};