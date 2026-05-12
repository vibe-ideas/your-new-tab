export type SearchProviderCapability = 'stable' | 'experimental' | 'manual';

export interface SearchProvider {
  id: string;
  name: string;
  urlTemplate?: string;
  baseUrl?: string;
  capability?: SearchProviderCapability;
  enabled?: boolean;
  autoSubmit?: boolean;
  useProxy?: boolean;
  iconSvg?: string;
}

export interface SearchProviderConfig {
  providers: SearchProvider[];
  defaultProviderId: string;
  lastProviderId: string;
  repaired: boolean;
}

export const DEFAULT_SEARCH_PROVIDERS: SearchProvider[] = [
  {
    id: 'google',
    name: 'Google AI',
    urlTemplate: 'https://www.google.com/search?q={query}&udm=50',
    capability: 'stable',
    enabled: true,
    autoSubmit: true,
    useProxy: false,
    iconSvg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1" x1="0%" x2="100%"><stop offset="0%" stop-color="#4285F4"/><stop offset="50%" stop-color="#34A853"/><stop offset="75%" stop-color="#FBBC05"/><stop offset="100%" stop-color="#EA4335"/></linearGradient></defs><circle cx="24" cy="24" r="22" fill="url(#g1)"/><text x="24" y="30" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle" fill="#fff">G</text></svg>`,
  },
  {
    id: 'metaso',
    name: 'Metaso',
    urlTemplate: 'https://metaso.cn/?q={query}',
    capability: 'stable',
    enabled: true,
    autoSubmit: true,
    useProxy: false,
    iconSvg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="22" fill="#6f42c1"/><text x="24" y="31" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle" fill="#fff">M</text></svg>`,
  },
];

export const DEFAULT_SEARCH_PROVIDER_ID = DEFAULT_SEARCH_PROVIDERS[0].id;

const DEFAULT_PROVIDER_MAP = new Map(
  DEFAULT_SEARCH_PROVIDERS.map((provider) => [provider.id, provider]),
);
const BUILT_IN_PROVIDER_IDS = new Set(
  DEFAULT_SEARCH_PROVIDERS.map((provider) => provider.id),
);

const LEGACY_PROVIDER_NAMES: Record<string, string[]> = {
  google: ['Google'],
};

const normalizeProviderName = (
  provider: Partial<SearchProvider>,
  defaults?: SearchProvider,
) => {
  const trimmedName = provider.name?.trim();
  if (trimmedName) {
    const legacyNames = provider.id ? LEGACY_PROVIDER_NAMES[provider.id] : undefined;
    if (defaults && legacyNames?.includes(trimmedName)) {
      return defaults.name;
    }
    return trimmedName;
  }

  return defaults?.name || provider.id?.trim() || 'Search';
};

export const isBuiltInSearchProvider = (providerId?: string | null) => (
  Boolean(providerId && BUILT_IN_PROVIDER_IDS.has(providerId))
);

export const normalizeSearchProvider = (provider: Partial<SearchProvider>): SearchProvider | null => {
  const trimmedId = provider.id?.trim();
  if (!trimmedId) {
    return null;
  }

  const defaults = DEFAULT_PROVIDER_MAP.get(trimmedId);

  return {
    ...defaults,
    ...provider,
    id: trimmedId,
    name: normalizeProviderName(provider, defaults),
    capability: provider.capability ?? defaults?.capability ?? 'experimental',
    enabled: defaults ? true : (provider.enabled ?? true),
    autoSubmit: provider.autoSubmit ?? defaults?.autoSubmit ?? true,
    useProxy: provider.useProxy ?? defaults?.useProxy ?? false,
    iconSvg: provider.iconSvg ?? defaults?.iconSvg,
  };
};

export const normalizeSearchProviders = (providers?: Array<Partial<SearchProvider>> | null): SearchProvider[] => {
  const normalizedProviders = (providers || [])
    .map(normalizeSearchProvider)
    .filter((provider): provider is SearchProvider => provider !== null);
  const normalizedProviderMap = new Map(
    normalizedProviders.map((provider) => [provider.id, provider]),
  );
  const mergedProviders: SearchProvider[] = [];
  const seenProviderIds = new Set<string>();

  for (const defaultProvider of DEFAULT_SEARCH_PROVIDERS) {
    mergedProviders.push(normalizedProviderMap.get(defaultProvider.id) || defaultProvider);
    seenProviderIds.add(defaultProvider.id);
  }

  for (const provider of normalizedProviders) {
    if (!seenProviderIds.has(provider.id)) {
      mergedProviders.push(provider);
      seenProviderIds.add(provider.id);
    }
  }

  if (mergedProviders.length > 0) {
    return mergedProviders;
  }

  return DEFAULT_SEARCH_PROVIDERS;
};

export const resolveSearchProviderId = (
  providers: SearchProvider[],
  preferredProviderIds: Array<string | null | undefined>,
) => {
  for (const providerId of preferredProviderIds) {
    if (providerId && providers.some((provider) => provider.id === providerId)) {
      return providerId;
    }
  }

  return providers[0]?.id || DEFAULT_SEARCH_PROVIDER_ID;
};

const isLegacyMetasoOnlyConfig = (providers?: Array<Partial<SearchProvider>> | null) => {
  const normalizedProviders = (providers || [])
    .map(normalizeSearchProvider)
    .filter((provider): provider is SearchProvider => provider !== null);

  return normalizedProviders.length === 1 && normalizedProviders[0].id === 'metaso';
};

export const repairSearchProviderConfig = ({
  providers,
  defaultProviderId,
  lastProviderId,
}: {
  providers?: Array<Partial<SearchProvider>> | null;
  defaultProviderId?: string | null;
  lastProviderId?: string | null;
}): SearchProviderConfig => {
  const normalizedProviders = normalizeSearchProviders(providers);
  const legacyMetasoOnlyConfig = isLegacyMetasoOnlyConfig(providers);
  const nextDefaultProviderId = legacyMetasoOnlyConfig
    ? DEFAULT_SEARCH_PROVIDER_ID
    : resolveSearchProviderId(normalizedProviders, [defaultProviderId, DEFAULT_SEARCH_PROVIDER_ID]);
  const nextLastProviderId = legacyMetasoOnlyConfig
    ? DEFAULT_SEARCH_PROVIDER_ID
    : resolveSearchProviderId(normalizedProviders, [lastProviderId, nextDefaultProviderId, DEFAULT_SEARCH_PROVIDER_ID]);
  const repairedProviders = JSON.stringify(providers || []) !== JSON.stringify(normalizedProviders);
  const repairedDefaultProvider = (defaultProviderId || null) !== nextDefaultProviderId;
  const repairedLastProvider = (lastProviderId || null) !== nextLastProviderId;

  return {
    providers: normalizedProviders,
    defaultProviderId: nextDefaultProviderId,
    lastProviderId: nextLastProviderId,
    repaired: legacyMetasoOnlyConfig || repairedProviders || repairedDefaultProvider || repairedLastProvider,
  };
};

export const getSearchProviderFallbackLabel = (provider?: Partial<SearchProvider> | null) => {
  const source = provider?.name?.trim() || provider?.id?.trim() || 'S';
  return source.charAt(0).toUpperCase();
};
