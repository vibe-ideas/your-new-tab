import { useState, useEffect } from 'react';
import { i18n, t } from '@/utils/i18n';
import {
  DEFAULT_SEARCH_PROVIDER_ID,
  repairSearchProviderConfig,
  type SearchProvider,
} from '@/utils/searchProviders';
import { DEFAULT_BOOKMARKS } from './defaultBookmarks';

function readStoredSearchProviderConfig() {
  try {
    const rawProviders = localStorage.getItem('searchProviders');
    return repairSearchProviderConfig({
      providers: rawProviders ? JSON.parse(rawProviders) as SearchProvider[] : undefined,
      defaultProviderId: localStorage.getItem('defaultSearchProvider'),
      lastProviderId: localStorage.getItem('lastSearchProvider'),
    });
  } catch (error) {
    console.warn('Failed to read search provider config from localStorage', error);
    return repairSearchProviderConfig({});
  }
}

function persistSearchProviderConfig(config: ReturnType<typeof readStoredSearchProviderConfig>) {
  localStorage.setItem('searchProviders', JSON.stringify(config.providers));
  localStorage.setItem('defaultSearchProvider', config.defaultProviderId);
  localStorage.setItem('lastSearchProvider', config.lastProviderId);
}

export function usePopupState() {
  const [bookmarksUrl, setBookmarksUrl] = useState('default');
  const [inputUrl, setInputUrl] = useState('');
  const [useDefaultBookmarks, setUseDefaultBookmarks] = useState(true);
  const [useDirectJson, setUseDirectJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [backgroundMediaUrlsInput, setBackgroundMediaUrlsInput] = useState('');
  const [status, setStatus] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getLanguage());

  const [providers, setProviders] = useState<SearchProvider[]>(() => {
    return readStoredSearchProviderConfig().providers;
  });

  const [defaultSearchProvider, setDefaultSearchProvider] = useState<string>(() => {
    return readStoredSearchProviderConfig().defaultProviderId;
  });

  useEffect(() => {
    const storedUseDefault = localStorage.getItem('useDefaultBookmarks') === 'true';
    const storedUseDirectJson = localStorage.getItem('useDirectJson') === 'true';
    const storedJsonInput = localStorage.getItem('bookmarksJson');
    const storedUrl = localStorage.getItem('bookmarksUrl');
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
      if (storedJsonInput) setJsonInput(storedJsonInput);
    } else if (storedUrl) {
      setBookmarksUrl(storedUrl);
      setInputUrl(storedUrl);
      setUseDirectJson(false);
      setJsonInput('');
    } else {
      setUseDefaultBookmarks(true);
      setBookmarksUrl('default');
      setInputUrl('');
      setUseDirectJson(false);
      setJsonInput('');
    }

    if (storedBackgroundMediaUrls) {
      setBackgroundMediaUrlsInput(storedBackgroundMediaUrls);
    }

    const config = readStoredSearchProviderConfig();
    setProviders(config.providers);
    setDefaultSearchProvider(config.defaultProviderId);
    if (config.repaired) persistSearchProviderConfig(config);
  }, []);

  const handleSave = () => {
    const normalizedBackgroundMediaUrls = backgroundMediaUrlsInput
      .split('\n').map((v) => v.trim()).filter(Boolean);

    if (useDefaultBookmarks) {
      localStorage.setItem('useDefaultBookmarks', 'true');
      localStorage.setItem('useDirectJson', 'false');
      localStorage.setItem('bookmarksUrl', 'default');
      localStorage.removeItem('bookmarksJson');
      setBookmarksUrl('default');
      setStatus(t('usingDefaultBookmarks'));
    } else if (useDirectJson) {
      try {
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
      const config = readStoredSearchProviderConfig();
      persistSearchProviderConfig(config);
      setProviders(config.providers);
      setDefaultSearchProvider(config.defaultProviderId);
    } catch (e) {
      console.warn('Failed to re-persist search provider config on save', e);
    }
  };

  const handleReset = () => {
    localStorage.setItem('useDefaultBookmarks', 'true');
    localStorage.setItem('useDirectJson', 'false');
    localStorage.setItem('bookmarksUrl', 'default');
    localStorage.removeItem('bookmarksJson');
    localStorage.removeItem('customBackgroundMediaUrls');
    localStorage.removeItem('customBackgroundMediaIndex');
    setBookmarksUrl('default');
    setInputUrl('');
    setUseDefaultBookmarks(true);
    setUseDirectJson(false);
    setJsonInput('');
    setBackgroundMediaUrlsInput('');
    setStatus(t('resetToDefault'));
    setTimeout(() => setStatus(''), 3000);
  };

  const handleSaveProviders = () => {
    try {
      const nextProviders = providers.length > 0
        ? providers.map((provider, index) => (
            providers.some((c) => c.enabled !== false)
              ? provider
              : index === 0 ? { ...provider, enabled: true } : provider
          ))
        : undefined;
      const config = repairSearchProviderConfig({
        providers: nextProviders,
        defaultProviderId: defaultSearchProvider,
        lastProviderId: defaultSearchProvider,
      });
      setProviders(config.providers);
      setDefaultSearchProvider(config.defaultProviderId);
      persistSearchProviderConfig(config);
      try { chrome.runtime.sendMessage({ action: 'refreshSearchConfig' }); } catch (_e) { /* noop */ }
      setStatus(t('saved'));
    } catch (_e) {
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
        setStatus(response.ok ? t('urlAccessible') : t('urlNotAccessible'));
      } catch (_error) {
        setStatus(t('urlNotAccessible'));
      }
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleFormatJson = () => {
    try {
      setJsonInput(JSON.stringify(JSON.parse(jsonInput), null, 2));
      setStatus(t('formatted'));
    } catch (error) {
      setStatus(t('formatFailed') + ': ' + (error as Error).message);
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleMinifyJson = () => {
    try {
      setJsonInput(JSON.stringify(JSON.parse(jsonInput)));
      setStatus(t('minified'));
    } catch (error) {
      setStatus(t('minifyFailed') + ': ' + (error as Error).message);
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleLanguageChange = (language: 'zh-CN' | 'en') => {
    i18n.setLanguage(language);
    setCurrentLanguage(language);
    setStatus(t('saved'));
    setTimeout(() => setStatus(''), 1000);
  };

  const isStatusError = /错误|无法|error|invalid|failed/i.test(status);

  const bookmarkModeLabel = useDefaultBookmarks
    ? `${t('builtInBookmarks')} · ${DEFAULT_BOOKMARKS.length}`
    : useDirectJson
      ? t('jsonMode')
      : t('urlMode');

  const handleRefreshBookmarks = () => {
    localStorage.setItem('bookmarksRefreshSignal', Date.now().toString());
    setStatus(t('bookmarksRefreshed'));
    setTimeout(() => setStatus(''), 3000);
  };

  return {
    bookmarksUrl, inputUrl, setInputUrl,
    useDefaultBookmarks, setUseDefaultBookmarks,
    useDirectJson, setUseDirectJson,
    jsonInput, setJsonInput,
    backgroundMediaUrlsInput, setBackgroundMediaUrlsInput,
    status, currentLanguage,
    providers, setProviders,
    defaultSearchProvider, setDefaultSearchProvider,
    handleSave, handleReset, handleSaveProviders, handleTest,
    handleFormatJson, handleMinifyJson, handleLanguageChange,
    handleRefreshBookmarks,
    isStatusError, bookmarkModeLabel,
  };
}
