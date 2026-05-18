import { useState, useEffect, useCallback } from 'react';
import { i18n, t } from '@/utils/i18n';
import {
  DEFAULT_SEARCH_PROVIDER_ID,
  repairSearchProviderConfig,
  type SearchProvider,
} from '@/utils/searchProviders';
import {
  type BookmarkGroupId,
  type BookmarkGroupLabels,
  DEFAULT_BOOKMARK_GROUP,
  EMPTY_BOOKMARK_GROUP_LABELS,
  broadcastBookmarkRefresh,
  clearBookmarkGroupCache,
  clearBookmarkGroupLabels,
  readActiveBookmarkGroup,
  readBookmarkGroupConfig,
  readBookmarkGroupLabels,
  resetBookmarkGroupConfig,
  writeActiveBookmarkGroup,
  writeBookmarkGroupConfig,
  writeBookmarkGroupLabels,
} from '@/utils/bookmarkGroups';
import { DEFAULT_BOOKMARKS } from '@/utils/defaultBookmarks';

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
  const [activeBookmarkGroup, setActiveBookmarkGroupState] = useState<BookmarkGroupId>(() => readActiveBookmarkGroup());
  const [groupLabels, setGroupLabels] = useState<BookmarkGroupLabels>(() => readBookmarkGroupLabels());
  const [bookmarksUrl, setBookmarksUrl] = useState('default');
  const [inputUrl, setInputUrl] = useState('');
  const [useDefaultBookmarks, setUseDefaultBookmarks] = useState(true);
  const [useDirectJson, setUseDirectJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [backgroundMediaUrlsInput, setBackgroundMediaUrlsInput] = useState('');
  const [statusEntry, setStatusEntry] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getLanguage());

  const status = statusEntry?.text ?? '';
  const isStatusError = statusEntry?.kind === 'error';

  const showSuccess = useCallback((text: string, autoClearMs = 3000) => {
    setStatusEntry({ text, kind: 'success' });
    if (autoClearMs > 0) setTimeout(() => setStatusEntry(null), autoClearMs);
  }, []);
  const showError = useCallback((text: string, autoClearMs = 3000) => {
    setStatusEntry({ text, kind: 'error' });
    if (autoClearMs > 0) setTimeout(() => setStatusEntry(null), autoClearMs);
  }, []);

  const [providers, setProviders] = useState<SearchProvider[]>(() => readStoredSearchProviderConfig().providers);
  const [defaultSearchProvider, setDefaultSearchProvider] = useState<string>(() => readStoredSearchProviderConfig().defaultProviderId);

  const loadGroupIntoUi = useCallback((group: BookmarkGroupId) => {
    const config = readBookmarkGroupConfig(group);
    setUseDefaultBookmarks(config.useDefaultBookmarks);
    setUseDirectJson(config.useDirectJson);
    setBookmarksUrl(config.useDefaultBookmarks ? 'default' : (config.bookmarksUrl || ''));
    setInputUrl(config.useDefaultBookmarks ? '' : config.bookmarksUrl);
    setJsonInput(config.useDirectJson ? config.bookmarksJson : '');
  }, []);

  useEffect(() => {
    loadGroupIntoUi(activeBookmarkGroup);

    const storedBackgroundMediaUrls = localStorage.getItem('customBackgroundMediaUrls');
    if (storedBackgroundMediaUrls) setBackgroundMediaUrlsInput(storedBackgroundMediaUrls);

    const config = readStoredSearchProviderConfig();
    setProviders(config.providers);
    setDefaultSearchProvider(config.defaultProviderId);
    if (config.repaired) persistSearchProviderConfig(config);
  }, [activeBookmarkGroup, loadGroupIntoUi]);

  const setActiveBookmarkGroup = useCallback((group: BookmarkGroupId) => {
    if (group === activeBookmarkGroup) return;
    writeActiveBookmarkGroup(group);
    setActiveBookmarkGroupState(group);
  }, [activeBookmarkGroup]);

  const setGroupLabel = useCallback((group: BookmarkGroupId, label: string) => {
    setGroupLabels((prev) => ({ ...prev, [group]: label }));
  }, []);

  const handleSave = () => {
    const normalizedBackgroundMediaUrls = backgroundMediaUrlsInput
      .split('\n').map((v) => v.trim()).filter(Boolean);

    if (useDirectJson) {
      try {
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          showError(t('jsonShouldBeArray'));
          return;
        }
      } catch (error) {
        showError(t('jsonInvalid') + ': ' + (error as Error).message);
        return;
      }
    }

    writeBookmarkGroupConfig(activeBookmarkGroup, {
      useDefaultBookmarks,
      useDirectJson: !useDefaultBookmarks && useDirectJson,
      bookmarksUrl: inputUrl,
      bookmarksJson: jsonInput,
    });
    writeBookmarkGroupLabels(groupLabels);
    clearBookmarkGroupCache(activeBookmarkGroup);

    if (useDefaultBookmarks) {
      setBookmarksUrl('default');
      showSuccess(t('usingDefaultBookmarks'));
    } else if (useDirectJson) {
      showSuccess(t('saved'));
    } else {
      setBookmarksUrl(inputUrl);
      showSuccess(t('saved'));
    }

    if (normalizedBackgroundMediaUrls.length > 0) {
      localStorage.setItem('customBackgroundMediaUrls', normalizedBackgroundMediaUrls.join('\n'));
    } else {
      localStorage.removeItem('customBackgroundMediaUrls');
    }
    localStorage.removeItem('customBackgroundMediaIndex');

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
    resetBookmarkGroupConfig(activeBookmarkGroup);
    clearBookmarkGroupLabels();
    localStorage.removeItem('customBackgroundMediaUrls');
    localStorage.removeItem('customBackgroundMediaIndex');
    setGroupLabels({ ...EMPTY_BOOKMARK_GROUP_LABELS });
    setBookmarksUrl('default');
    setInputUrl('');
    setUseDefaultBookmarks(true);
    setUseDirectJson(false);
    setJsonInput('');
    setBackgroundMediaUrlsInput('');
    showSuccess(t('resetToDefault'));
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
      showSuccess(t('saved'), 2000);
    } catch (_e) {
      showError(t('jsonInvalid'), 2000);
    }
  };

  const handleTest = async () => {
    if (useDirectJson) {
      try {
        const parsed = JSON.parse(jsonInput);
        if (Array.isArray(parsed)) {
          showSuccess(t('jsonValid'));
        } else {
          showError(t('jsonShouldBeArray'));
        }
      } catch (error) {
        showError(t('jsonInvalid') + ': ' + (error as Error).message);
      }
    } else {
      try {
        const response = await fetch(inputUrl);
        if (response.ok) showSuccess(t('urlAccessible'));
        else showError(t('urlNotAccessible'));
      } catch (_error) {
        showError(t('urlNotAccessible'));
      }
    }
  };

  const handleFormatJson = () => {
    try {
      setJsonInput(JSON.stringify(JSON.parse(jsonInput), null, 2));
      showSuccess(t('formatted'));
    } catch (error) {
      showError(t('formatFailed') + ': ' + (error as Error).message);
    }
  };

  const handleMinifyJson = () => {
    try {
      setJsonInput(JSON.stringify(JSON.parse(jsonInput)));
      showSuccess(t('minified'));
    } catch (error) {
      showError(t('minifyFailed') + ': ' + (error as Error).message);
    }
  };

  const handleLanguageChange = (language: 'zh-CN' | 'en') => {
    i18n.setLanguage(language);
    setCurrentLanguage(language);
    showSuccess(t('saved'), 1000);
  };

  const bookmarkModeLabel = useDefaultBookmarks
    ? `${t('builtInBookmarks')} · ${DEFAULT_BOOKMARKS.length}`
    : useDirectJson ? t('jsonMode') : t('urlMode');

  const handleRefreshBookmarks = () => {
    clearBookmarkGroupCache(activeBookmarkGroup);
    broadcastBookmarkRefresh();
    showSuccess(t('bookmarksRefreshed'));
  };

  return {
    activeBookmarkGroup, setActiveBookmarkGroup,
    groupLabels, setGroupLabel,
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

export { DEFAULT_SEARCH_PROVIDER_ID };
