import React from 'react';
import {
  DEFAULT_SEARCH_PROVIDER_ID,
  repairSearchProviderConfig,
  resolveSearchProviderId,
  type SearchProvider,
  type SearchProviderConfig,
} from '@/utils/searchProviders';

const PROVIDERS_KEY = 'searchProviders';
const DEFAULT_KEY = 'defaultSearchProvider';
const LAST_KEY = 'lastSearchProvider';

const readStoredConfig = (): SearchProviderConfig => {
  try {
    const raw = localStorage.getItem(PROVIDERS_KEY);
    return repairSearchProviderConfig({
      providers: raw ? (JSON.parse(raw) as SearchProvider[]) : undefined,
      defaultProviderId: localStorage.getItem(DEFAULT_KEY),
      lastProviderId: localStorage.getItem(LAST_KEY),
    });
  } catch (error) {
    console.warn('Failed to read search provider config', error);
    return repairSearchProviderConfig({});
  }
};

const persistConfig = (config: SearchProviderConfig) => {
  try {
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(config.providers));
    localStorage.setItem(DEFAULT_KEY, config.defaultProviderId);
    localStorage.setItem(LAST_KEY, config.lastProviderId);
  } catch (error) {
    console.warn('Failed to persist search provider config', error);
  }
};

const pickSelectable = (providers: SearchProvider[]): SearchProvider[] => {
  const enabled = providers.filter((p) => p.enabled !== false);
  if (enabled.length > 0) return enabled;
  if (providers.length > 0) return providers;
  return readStoredConfig().providers;
};

export interface SearchProvidersApi {
  providers: SearchProvider[];
  selectableProviders: SearchProvider[];
  activeProvider: SearchProvider | undefined;
  activeProviderId: string;
  selectProvider: (id: string) => void;
}

export const useSearchProviders = (): SearchProvidersApi => {
  const [providers, setProviders] = React.useState<SearchProvider[]>(() => readStoredConfig().providers);
  const [selectedId, setSelectedId] = React.useState<string>(() => {
    const config = readStoredConfig();
    return resolveSearchProviderId(config.providers, [
      config.lastProviderId,
      config.defaultProviderId,
      DEFAULT_SEARCH_PROVIDER_ID,
    ]);
  });

  React.useEffect(() => {
    const config = readStoredConfig();
    setProviders(config.providers);
    setSelectedId(resolveSearchProviderId(config.providers, [
      config.lastProviderId,
      config.defaultProviderId,
      DEFAULT_SEARCH_PROVIDER_ID,
    ]));
    if (config.repaired) persistConfig(config);
  }, []);

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (![PROVIDERS_KEY, DEFAULT_KEY, LAST_KEY].includes(event.key || '')) return;
      try {
        const config = readStoredConfig();
        setProviders(config.providers);
        setSelectedId((current) => resolveSearchProviderId(config.providers, [
          config.lastProviderId,
          config.defaultProviderId,
          current,
          DEFAULT_SEARCH_PROVIDER_ID,
        ]));
        if (config.repaired) persistConfig(config);
      } catch (error) {
        console.warn('Failed to reload search provider config', error);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const selectProvider = React.useCallback((id: string) => {
    setSelectedId(id);
    try { localStorage.setItem(LAST_KEY, id); } catch { /* ignore */ }
  }, []);

  const selectableProviders = pickSelectable(providers);
  const activeProviderId = resolveSearchProviderId(selectableProviders, [selectedId]);
  const activeProvider = selectableProviders.find((p) => p.id === activeProviderId) || selectableProviders[0];

  return { providers, selectableProviders, activeProvider, activeProviderId, selectProvider };
};
