import { useState, useEffect } from 'react';
import { i18n, t } from '@/utils/i18n';
import './App.css';

// 默认内置书签数据 - 来自 example-bookmarks-with-icons.json
const DEFAULT_BOOKMARKS = [
  {
    id: '1',
    title: 'ShanSan',
    url: 'https://shansan.top/',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
  },
  {
    id: '2',
    title: 'vscode-blog',
    url: 'https://code.visualstudio.com/blogs',
    icon: '<svg t="1756912815338" class="icon" viewBox="0 0 1027 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10955" width="200" height="200"><path d="M769.853003 0v879.449982L1.953432 765.394768l767.899571 258.573725 255.994093-106.489604V122.365176l0.082706-0.039384-0.082706-0.165411v-15.6629l-255.994093-106.493543z" fill="#007ACC" p-id="10956"></path><path d="M501.126159 149.827435L265.926663 382.32127 124.31467 275.678069l-58.358777 19.494935 144.065599 142.411483-144.065599 142.403606 58.358777 19.494934 141.604116-106.651077h0.007877l235.187681 232.48202 140.867641-59.851419V209.678854l-140.859765-59.851419z m-0.007877 165.88811v243.706376l-161.811897-121.853188 161.811897-121.853188z" fill="#007ACC" p-id="10957"></path></svg>'
  },
  {
    id: '3',
    title: 'Telegram',
    url: 'https://web.telegram.org/a/',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 64 64"><path d="M32,10c12.15,0,22,9.85,22,22s-9.85,22-22,22s-22-9.85-22-22S19.85,10,32,10z M39.589,40.968c0.404-1.241,2.301-13.615,2.534-16.054c0.071-0.738-0.163-1.229-0.619-1.449c-0.553-0.265-1.371-0.133-2.322,0.21c-1.303,0.47-17.958,7.541-18.92,7.951c-0.912,0.388-1.775,0.81-1.775,1.423c0,0.431,0.256,0.673,0.96,0.924c0.732,0.261,2.577,0.82,3.668,1.121c1.05,0.29,2.243,0.038,2.913-0.378c0.709-0.441,8.901-5.921,9.488-6.402c0.587-0.48,1.056,0.135,0.576,0.616c-0.48,0.48-6.102,5.937-6.844,6.693c-0.901,0.917-0.262,1.868,0.343,2.249c0.689,0.435,5.649,3.761,6.396,4.295c0.747,0.534,1.504,0.776,2.198,0.776C38.879,42.942,39.244,42.028,39.589,40.968z"></path></svg>'
  },
  {
    id: '4',
    title: 'daily.dev',
    url: 'https://app.daily.dev/',
    icon: '<svg t="1756912723086" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9967" width="200" height="200"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#8CA8E6" p-id="9968"></path><path d="M350.464 325.412571c14.628571 0 26.441143-9.947429 26.441143-22.125714V241.517714c0-12.178286-11.812571-22.089143-26.441143-22.089143-14.628571 0-26.404571 9.874286-26.404571 22.089143v61.769143c0 12.178286 11.849143 22.125714 26.404571 22.125714z m162.121143 0c14.628571 0 26.404571-9.947429 26.404571-22.125714V241.517714c0-12.178286-11.849143-22.089143-26.404571-22.089143-14.628571 0-26.441143 9.874286-26.441143 22.089143v61.769143c0 12.178286 11.812571 22.125714 26.441143 22.125714z m207.250286-49.115428c5.010286 6.765714 7.936 14.701714 7.936 23.222857 0 24.502857-23.771429 44.397714-53.138286 44.397714s-53.138286-19.858286-53.138286-44.397714c0-8.521143 2.925714-16.457143 7.936-23.222857v-32.182857h-71.68v32.182857c5.010286 6.765714 7.936 14.701714 7.936 23.222857 0 24.502857-23.771429 44.397714-53.101714 44.397714-29.366857 0-53.174857-19.858286-53.174857-44.397714 0-8.521143 2.925714-16.457143 7.936-23.222857v-32.182857h-71.68v32.182857c4.973714 6.765714 7.936 14.701714 7.936 23.222857 0 24.502857-23.808 44.397714-53.174857 44.397714-29.330286 0-53.065143-19.894857-53.065143-44.397714 0-8.521143 2.925714-16.457143 7.899428-23.222857v-32.182857H292.571429a36.571429 36.571429 0 0 0-36.571429 36.571428V768a36.571429 36.571429 0 0 0 36.937143 36.571429l438.857143-4.498286a36.571429 36.571429 0 0 0 36.205714-36.571429V280.649143a36.571429 36.571429 0 0 0-36.571429-36.571429h-11.593142v32.219429zM341.321143 652.178286c0-14.08 11.410286-25.453714 25.490286-25.453715h290.377142a25.453714 25.453714 0 0 1 0 50.907429h-290.377142a25.453714 25.453714 0 0 1-25.453715-25.453714z m0-101.814857c0-14.08 11.410286-25.490286 25.490286-25.490286h290.377142a25.453714 25.453714 0 1 1 0 50.907429h-290.377142a25.453714 25.453714 0 0 1-25.453715-25.453714z m0-101.778286c0-14.08 11.410286-25.490286 25.490286-25.490285h290.377142a25.453714 25.453714 0 1 1 0 50.907428h-290.377142a25.453714 25.453714 0 0 1-25.453715-25.453714zM365.811429 447.634286h290.377142a25.453714 25.453714 0 1 1 0 50.907428h-290.377142a25.453714 25.453714 0 0 1 0-50.907428z" fill="#FFFFFF" p-id="9969"></path></svg>'
  },
  {
    id: '5',
    title: 'GitHub',
    url: 'https://github.com',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>'
  },
  {
    id: '6',
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48"><path fill="#607D8B" d="M9 28H12V42H9z"></path><path fill="#607D8B" d="M9 39H35V42H9z"></path><path fill="#607D8B" d="M32 28H35V42H32zM15 34H29V37H15z"></path><path fill="#A68A6E" d="M14.88 29H28.880000000000003V32H14.88z" transform="rotate(6.142 21.88 30.5)"></path><path fill="#EF6C00" d="M29.452 11.646H43.451V14.647H29.452z" transform="rotate(81.234 36.453 13.148)"></path><path fill="#FF9800" d="M23.576 13.578H37.574V16.579H23.576z" transform="rotate(60.79 30.576 15.079)"></path><path fill="#D38B28" d="M18.395 18.275H32.393V21.276H18.395z" transform="rotate(34.765 25.396 19.777)"></path><path fill="#C09553" d="M15.977 23.499H29.976V26.5H15.977z" transform="rotate(19.785 22.978 25.003)"></path></svg>'
  }
];

function App() {
  const [bookmarksUrl, setBookmarksUrl] = useState('https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json');
  const [inputUrl, setInputUrl] = useState('');
  const [useDefaultBookmarks, setUseDefaultBookmarks] = useState(false);
  const [useDirectJson, setUseDirectJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [backgroundMediaUrlsInput, setBackgroundMediaUrlsInput] = useState('');
  const [status, setStatus] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getLanguage());
  // Search providers config
  type SearchProvider = {
    id: string;
    name: string;
    urlTemplate?: string;
    capability?: 'stable'|'experimental'|'manual';
    enabled?: boolean;
    useProxy?: boolean;
  };

  const [providers, setProviders] = useState<SearchProvider[]>(() => {
    try {
      const raw = localStorage.getItem('searchProviders');
      if (raw) return JSON.parse(raw) as SearchProvider[];
    } catch (e) {
      console.warn('Failed to parse searchProviders from localStorage', e);
    }
    return [
      { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q={query}&udm=50', capability: 'stable' as const, enabled: true, useProxy: false },
      { id: 'metaso', name: 'Metaso', urlTemplate: 'https://metaso.cn/?q={query}', capability: 'stable' as const, enabled: true, useProxy: false }
    ];
  });

  const [defaultSearchProvider, setDefaultSearchProvider] = useState<string>(() => {
    try {
      return localStorage.getItem('defaultSearchProvider') || (providers[0] && providers[0].id) || 'google';
    } catch (e) {
      return 'google';
    }
  });

  // Load bookmarks URL from localStorage on component mount
  useEffect(() => {
    const storedUrl = localStorage.getItem('bookmarksUrl');
    const storedUseDefault = localStorage.getItem('useDefaultBookmarks') === 'true';
    const storedUseDirectJson = localStorage.getItem('useDirectJson') === 'true';
    const storedJsonInput = localStorage.getItem('bookmarksJson');
    const storedBackgroundMediaUrls = localStorage.getItem('customBackgroundMediaUrls');
    
    if (storedUseDefault) {
      setUseDefaultBookmarks(true);
      setBookmarksUrl('default');
      setInputUrl('');
      setUseDirectJson(false);
      setJsonInput('');
    } else if (storedUseDirectJson) {
      setUseDefaultBookmarks(false);
      setUseDirectJson(true);
      setInputUrl('');
      if (storedJsonInput) {
        setJsonInput(storedJsonInput);
      }
    } else if (storedUrl) {
      setBookmarksUrl(storedUrl);
      setInputUrl(storedUrl);
      setUseDirectJson(false);
      setJsonInput('');
    } else {
      setInputUrl(bookmarksUrl);
      setUseDirectJson(false);
      setJsonInput('');
    }

    if (storedBackgroundMediaUrls) {
      setBackgroundMediaUrlsInput(storedBackgroundMediaUrls);
    }
  }, []);

  const handleSave = () => {
    const normalizedBackgroundMediaUrls = backgroundMediaUrlsInput
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);

    if (useDefaultBookmarks) {
      localStorage.setItem('useDefaultBookmarks', 'true');
      localStorage.setItem('useDirectJson', 'false');
      localStorage.setItem('bookmarksUrl', 'default');
      localStorage.removeItem('bookmarksJson');
      setBookmarksUrl('default');
      setStatus(t('usingDefaultBookmarks'));
    } else if (useDirectJson) {
      try {
        // Validate JSON input
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          setStatus(t('jsonShouldBeArray'));
          setTimeout(() => setStatus(''), 3000);
          return;
        }
        
        localStorage.setItem('useDefaultBookmarks', 'false');
        localStorage.setItem('useDirectJson', 'true');
        localStorage.setItem('bookmarksJson', jsonInput);
        localStorage.removeItem('bookmarksUrl');
        setStatus(t('saved'));
      } catch (error) {
        setStatus(t('jsonInvalid') + ': ' + (error as Error).message);
        setTimeout(() => setStatus(''), 3000);
        return;
      }
    } else {
      localStorage.setItem('useDefaultBookmarks', 'false');
      localStorage.setItem('useDirectJson', 'false');
      localStorage.setItem('bookmarksUrl', inputUrl);
      localStorage.removeItem('bookmarksJson');
      setBookmarksUrl(inputUrl);
      setStatus(t('saved'));
    }

    if (normalizedBackgroundMediaUrls.length > 0) {
      localStorage.setItem('customBackgroundMediaUrls', normalizedBackgroundMediaUrls.join('\n'));
    } else {
      localStorage.removeItem('customBackgroundMediaUrls');
    }
    localStorage.removeItem('customBackgroundMediaIndex');

    setTimeout(() => setStatus(''), 3000);
    try {
      // Also save default search provider if not present
      const rawProviders = localStorage.getItem('searchProviders');
      if (!rawProviders) {
        const defaultProviders = [
          { id: 'metaso', name: 'Metaso', urlTemplate: 'https://metaso.cn/?q={query}', capability: 'stable' as const, enabled: true, useProxy: false }
        ];
        localStorage.setItem('searchProviders', JSON.stringify(defaultProviders));
      }

      // Notify background to refresh search config
      try {
        chrome.runtime.sendMessage({ action: 'refreshSearchConfig' });
      } catch (e) {
        console.warn('Failed to send refreshSearchConfig message', e);
      }
      try {
        chrome.runtime.sendMessage({ action: 'refreshBackgroundConfig' });
      } catch (e) {
        console.warn('Failed to send refreshBackgroundConfig message', e);
      }
    } catch (e) {
      console.warn('Failed to save searchProviders default or notify background', e);
    }
  };

  const handleReset = () => {
    const defaultUrl = 'https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json';
    localStorage.setItem('useDefaultBookmarks', 'false');
    localStorage.setItem('useDirectJson', 'false');
    localStorage.setItem('bookmarksUrl', defaultUrl);
    localStorage.removeItem('bookmarksJson');
    localStorage.removeItem('customBackgroundMediaUrls');
    localStorage.removeItem('customBackgroundMediaIndex');
    setBookmarksUrl(defaultUrl);
    setInputUrl(defaultUrl);
    setUseDefaultBookmarks(false);
    setUseDirectJson(false);
    setJsonInput('');
    setBackgroundMediaUrlsInput('');
    setStatus(t('resetToDefault'));
    setTimeout(() => setStatus(''), 3000);
    try {
      chrome.runtime.sendMessage({ action: 'refreshBackgroundConfig' });
    } catch (e) {
      console.warn('Failed to send refreshBackgroundConfig message', e);
    }
  };

  const handleSaveProviders = () => {
    try {
      localStorage.setItem('searchProviders', JSON.stringify(providers));
      localStorage.setItem('defaultSearchProvider', defaultSearchProvider);
      // Notify background to refresh search config
      try { chrome.runtime.sendMessage({ action: 'refreshSearchConfig' }); } catch (e) {}
      setStatus(t('saved'));
    } catch (e) {
      console.warn('Failed to save providers', e);
      setStatus(t('jsonInvalid'));
    }
    setTimeout(() => setStatus(''), 2000);
  };

  const handleTest = async () => {
    if (useDirectJson) {
      try {
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          setStatus(t('jsonShouldBeArray'));
        } else {
          setStatus(t('jsonValid'));
        }
      } catch (error) {
        setStatus(t('jsonInvalid') + ': ' + (error as Error).message);
      }
    } else {
      try {
        const response = await fetch(inputUrl);
        if (response.ok) {
          setStatus(t('urlAccessible'));
        } else {
          setStatus(t('urlNotAccessible'));
        }
      } catch (error) {
        setStatus(t('urlNotAccessible'));
      }
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
      setStatus(t('formatted'));
    } catch (error) {
      setStatus(t('formatFailed') + ': ' + (error as Error).message);
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleMinifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsed);
      setJsonInput(minified);
      setStatus(t('minified'));
    } catch (error) {
      setStatus(t('minifyFailed') + ': ' + (error as Error).message);
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleLanguageChange = (language: 'zh-CN' | 'en') => {
    i18n.setLanguage(language);
    setCurrentLanguage(language);
    // 强制重新渲染
    setStatus(t('saved'));
    setTimeout(() => setStatus(''), 1000);
  };

  const isStatusError = /错误|无法|error|invalid|failed/i.test(status);
  const uiText = currentLanguage === 'zh-CN'
    ? {
        subtitle: '统一管理书签源、搜索引擎和动态背景，让新标签页更顺手。',
        bookmarkSection: '书签来源',
        bookmarkSectionHint: '选择内置书签、远程 JSON，或直接粘贴自己的书签数据。',
        defaultMode: `内置书签 · ${DEFAULT_BOOKMARKS.length} 项`,
        jsonMode: '直接 JSON',
        urlMode: '远程 URL',
        searchSection: '搜索引擎',
        searchSectionHint: '设置默认搜索引擎，并维护可切换的搜索列表。',
        searchProviderName: '名称',
        searchProviderUrl: '搜索 URL 模板',
        addProvider: '新增搜索提供商',
        removeProvider: '删除',
        enabled: '已启用',
        disabled: '已停用',
        proxyLabel: '使用代理',
        proxyNote: '如果启用代理，扩展会通过后台脚本抓取搜索页 HTML，适合处理跨域或前端渲染较重的网站；启用前请确认目标站点允许这种访问方式。',
        backgroundSection: '动态背景',
        backgroundSectionHint: '支持 GIF、WebP、APNG 和 MP4/WebM/MOV 直链。',
        actionsSection: '快速操作',
        actionsSectionHint: '保存当前配置、测试来源可用性，或手动刷新书签。',
      }
    : {
        subtitle: 'Manage bookmark sources, search engines, and animated backgrounds from one polished control panel.',
        bookmarkSection: 'Bookmark source',
        bookmarkSectionHint: 'Switch between built-in bookmarks, a remote JSON file, or directly pasted bookmark data.',
        defaultMode: `Built-in · ${DEFAULT_BOOKMARKS.length} items`,
        jsonMode: 'Direct JSON',
        urlMode: 'Remote URL',
        searchSection: 'Search providers',
        searchSectionHint: 'Set the default provider and maintain the list shown in the new tab page.',
        searchProviderName: 'Name',
        searchProviderUrl: 'Search URL template',
        addProvider: 'Add provider',
        removeProvider: 'Remove',
        enabled: 'Enabled',
        disabled: 'Disabled',
        proxyLabel: 'Use proxy',
        proxyNote: 'When proxy is enabled, the extension fetches provider HTML through the background script. This can help with cross-origin or heavily client-rendered search pages, but should only be used when the target site allows it.',
        backgroundSection: 'Animated backgrounds',
        backgroundSectionHint: 'Supports direct GIF, WebP, APNG, MP4, WebM, and MOV links.',
        actionsSection: 'Quick actions',
        actionsSectionHint: 'Save the current configuration, test data sources, or refresh bookmarks manually.',
      };

  const bookmarkModeLabel = useDefaultBookmarks
    ? uiText.defaultMode
    : useDirectJson
      ? uiText.jsonMode
      : uiText.urlMode;

  return (
    <div className="popup-shell">
      <header className="popup-hero">
        <div className="popup-hero-copy">
          <div className="popup-badge">Your New Tab</div>
          <h1 className="popup-title">{t('title')}</h1>
          <p className="popup-subtitle">{uiText.subtitle}</p>
        </div>
        <div className="language-switcher">
          <button
            className={`language-button ${currentLanguage === 'zh-CN' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('zh-CN')}
            type="button"
          >
            中文
          </button>
          <button
            className={`language-button ${currentLanguage === 'en' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('en')}
            type="button"
          >
            English
          </button>
        </div>
      </header>

      {status && (
        <div className={`status-message ${isStatusError ? 'error' : 'success'}`}>
          {status}
        </div>
      )}

      <div className="card">
        <section className="config-panel">
          <div className="section-heading">
            <div>
              <h2>{uiText.bookmarkSection}</h2>
              <p>{uiText.bookmarkSectionHint}</p>
            </div>
            <span className="section-badge">{bookmarkModeLabel}</span>
          </div>

          <div className="toggle-grid">
            <label className={`toggle-card ${useDefaultBookmarks ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={useDefaultBookmarks}
                onChange={(e) => {
                  setUseDefaultBookmarks(e.target.checked);
                  if (e.target.checked) {
                    setUseDirectJson(false);
                  }
                }}
              />
              <div>
                <strong>{t('useDefaultBookmarks')}</strong>
                <span>{t('defaultBookmarksDescription')}</span>
              </div>
            </label>

            <label className={`toggle-card ${useDirectJson ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={useDirectJson}
                onChange={(e) => {
                  setUseDirectJson(e.target.checked);
                  if (e.target.checked) {
                    setUseDefaultBookmarks(false);
                  }
                }}
              />
              <div>
                <strong>{t('useDirectJson')}</strong>
                <span>{t('directJsonDescription')}</span>
              </div>
            </label>
          </div>

          {!useDefaultBookmarks && useDirectJson && (
            <div className="field-stack">
              <label htmlFor="bookmarksJson" className="field-label">
                {t('bookmarksJson')}
              </label>
              <textarea
                id="bookmarksJson"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={t('jsonInputPlaceholder')}
                className="input-field textarea-field json-textarea"
                rows={14}
              />
              <div className="inline-actions">
                <button onClick={handleFormatJson} className="secondary-button" type="button">
                  {t('format')}
                </button>
                <button onClick={handleMinifyJson} className="secondary-button" type="button">
                  {t('minify')}
                </button>
              </div>
            </div>
          )}

          {!useDefaultBookmarks && !useDirectJson && (
            <div className="field-stack">
              <label htmlFor="bookmarksUrl" className="field-label">
                {t('bookmarksUrl')}
              </label>
              <input
                id="bookmarksUrl"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder={t('urlInputPlaceholder')}
                className="input-field"
              />
              <div className="config-info">{t('urlInputTip')}</div>
            </div>
          )}
        </section>

        <section className="config-panel">
          <div className="section-heading">
            <div>
              <h2>{uiText.searchSection}</h2>
              <p>{uiText.searchSectionHint}</p>
            </div>
          </div>

          <div className="default-provider-row">
            <select
              value={defaultSearchProvider}
              onChange={(e) => setDefaultSearchProvider(e.target.value)}
              className="input-field select-field"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={handleSaveProviders} className="secondary-button" type="button">
              {t('save')}
            </button>
          </div>

          <div className="provider-list">
            {providers.map((p, idx) => (
              <div key={p.id} className="provider-card">
                <div className="provider-card-header">
                  <label className="provider-toggle">
                    <input
                      type="checkbox"
                      checked={p.enabled !== false}
                      onChange={(e) => {
                        const next = [...providers];
                        next[idx] = { ...p, enabled: e.target.checked };
                        setProviders(next);
                      }}
                    />
                    <span>{p.enabled !== false ? uiText.enabled : uiText.disabled}</span>
                  </label>
                  <button
                    onClick={() => {
                      const next = providers.filter((pp) => pp.id !== p.id);
                      setProviders(next);
                    }}
                    className="ghost-button"
                    type="button"
                  >
                    {uiText.removeProvider}
                  </button>
                </div>
                <div className="provider-fields">
                  <input
                    className="input-field"
                    value={p.name}
                    onChange={(e) => {
                      const next = [...providers];
                      next[idx] = { ...p, name: e.target.value };
                      setProviders(next);
                    }}
                    placeholder={uiText.searchProviderName}
                  />
                  <input
                    className="input-field"
                    value={p.urlTemplate || ''}
                    onChange={(e) => {
                      const next = [...providers];
                      next[idx] = { ...p, urlTemplate: e.target.value };
                      setProviders(next);
                    }}
                    placeholder={uiText.searchProviderUrl}
                  />
                </div>
                <label className="provider-toggle provider-proxy-toggle" title="Fetch provider HTML via background proxy">
                  <input
                    type="checkbox"
                    checked={!!p.useProxy}
                    onChange={(e) => {
                      const next = [...providers];
                      next[idx] = { ...p, useProxy: e.target.checked };
                      setProviders(next);
                    }}
                  />
                  <span>{uiText.proxyLabel}</span>
                </label>
              </div>
            ))}
          </div>

          <div className="inline-actions">
            <button
              onClick={() => {
                const id = `custom_${Date.now()}`;
                const next = [...providers, { id, name: 'Custom', urlTemplate: '', capability: 'experimental' as const, enabled: true }];
                setProviders(next);
              }}
              className="secondary-button"
              type="button"
            >
              {uiText.addProvider}
            </button>
          </div>

          <div className="config-info subtle-info">
            <strong>Proxy:</strong> {uiText.proxyNote}
          </div>
        </section>

        <section className="config-panel">
          <div className="section-heading">
            <div>
              <h2>{uiText.backgroundSection}</h2>
              <p>{uiText.backgroundSectionHint}</p>
            </div>
          </div>

          <div className="field-stack">
            <label htmlFor="backgroundMediaUrls" className="field-label">
              {t('backgroundMediaUrls')}
            </label>
            <textarea
              id="backgroundMediaUrls"
              value={backgroundMediaUrlsInput}
              onChange={(e) => setBackgroundMediaUrlsInput(e.target.value)}
              placeholder={t('backgroundMediaPlaceholder')}
              className="input-field textarea-field"
              rows={5}
            />
            <div className="config-info">{t('backgroundMediaTip')}</div>
          </div>
        </section>

        <section className="config-panel">
          <div className="section-heading">
            <div>
              <h2>{uiText.actionsSection}</h2>
              <p>{uiText.actionsSectionHint}</p>
            </div>
          </div>

          <div className="action-grid">
            <button id="saveConfigButton" onClick={handleSave} className="primary-button" type="button">
              {t('save')}
            </button>
            <button onClick={handleReset} className="secondary-button" type="button">
              {t('reset')}
            </button>
            {(!useDefaultBookmarks || useDirectJson) && (
              <button onClick={handleTest} className="secondary-button" type="button">
                {t('test')}
              </button>
            )}
            <button
              onClick={() => {
                chrome.runtime.sendMessage({ action: 'refreshBookmarks' });
                setStatus(t('bookmarksRefreshed'));
                setTimeout(() => setStatus(''), 3000);
              }}
              className="ghost-button"
              type="button"
            >
              {t('refreshBookmarks')}
            </button>
          </div>

          <div className="config-summary-card">
            <div className="label">{t('currentConfig')}</div>
            <code>
              {useDefaultBookmarks ? t('builtInBookmarks') : useDirectJson ? t('directJsonLabel') : t('urlLabel') + bookmarksUrl}
            </code>
          </div>
        </section>
      </div>

      <p className="read-the-docs">
        {useDefaultBookmarks
          ? t('defaultBookmarksDescription')
          : useDirectJson
            ? t('directJsonDescription')
            : t('urlBookmarksDescription')}
      </p>
    </div>
  );
}

export default App;
