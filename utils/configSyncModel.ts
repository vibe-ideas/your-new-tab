import { DEFAULT_SEARCH_PROVIDERS, DEFAULT_SEARCH_PROVIDER_ID, repairSearchProviderConfig, normalizeSearchProvider } from './searchProviders';
import { DEFAULT_ANNIVERSARIES, sanitizeAnniversaryItems } from './anniversaries';
import { isHttpUrl, isHttpSearchTemplate } from './safeUrl';

export const SYNC_SECTIONS = ['search', 'external', 'internal', 'backgrounds', 'dates', 'language'] as const;
export type SyncSection = typeof SYNC_SECTIONS[number];
export type SyncValue = Record<string, unknown> | null;
export type SyncSnapshot = Record<SyncSection, SyncValue>;
export type SyncPatch = Partial<SyncSnapshot>;
export const SYNC_STATE_KEY = 'configSync.state.v1';
export const SYNC_BACKUP_KEY = 'configSync.backup.v1';
export const SYNC_PREFIX = 'config.v1.';
export const SYNC_LIMIT = 102400;
export interface SyncState {
  values: SyncSnapshot;
  pending: SyncPatch;
  initialized: boolean;
  bytes: number;
  status: 'ready' | 'pending' | 'error';
  error?: string;
  lastCheckedAt?: number;
  lastWrittenAt?: number;
  lastReceivedAt?: number;
}
export const emptySnapshot = (): SyncSnapshot => ({ search: null, external: null, internal: null, backgrounds: null, dates: null, language: null });
export const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : isRecord(value)
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
// Browser storage may reorder object keys. That must not count as a user edit.
export const same = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const invalid = () => { throw new Error('Invalid configuration data'); };

// This module also runs in the service worker: no DOM, localStorage or i18n imports.
export function validateSection(section: SyncSection, value: unknown): SyncValue {
  if (value === null) return null;
  if (!isRecord(value)) return invalid();
  if (section === 'external' || section === 'internal') {
    if (!['default', 'json', 'remote'].includes(String(value.source)) || typeof value.label !== 'string') return invalid();
    if (value.source === 'remote' && (typeof value.url !== 'string' || !isHttpUrl(value.url))) return invalid();
    if (value.source === 'json') {
      if (!Array.isArray(value.bookmarks)) return invalid();
      const ids = new Set<string>();
      for (const row of value.bookmarks) {
        if (!isRecord(row) || typeof row.id !== 'string' || !row.id.trim() || ids.has(row.id.trim()) || typeof row.title !== 'string' || !row.title.trim() || !isHttpUrl(row.url)) return invalid();
        ids.add(row.id.trim());
      }
    }
    return { source: value.source, label: value.label, ...(value.source === 'json' ? { bookmarks: value.bookmarks } : value.source === 'remote' ? { url: value.url } : {}) };
  }
  if (section === 'search') {
    if (!Array.isArray(value.providers) || typeof value.defaultProviderId !== 'string') return invalid();
    for (const provider of value.providers) {
      if (!isRecord(provider) || typeof provider.id !== 'string' || !provider.id || typeof provider.name !== 'string' || !provider.name.trim()) return invalid();
      if (!(provider.capability === 'manual' && isHttpUrl(provider.baseUrl)) && !(isHttpSearchTemplate(provider.urlTemplate) && String(provider.urlTemplate).includes('{query}'))) return invalid();
      for (const key of ['enabled', 'autoSubmit', 'requiresLogin']) if (provider[key] !== undefined && typeof provider[key] !== 'boolean') return invalid();
      if (provider.iconSvg !== undefined && typeof provider.iconSvg !== 'string') return invalid();
    }
    return { providers: value.providers, defaultProviderId: value.defaultProviderId };
  }
  if (section === 'backgrounds') {
    if (!Array.isArray(value.urls) || !value.urls.every((url) => typeof url === 'string' && isHttpUrl(url))) return invalid();
    return { urls: value.urls };
  }
  if (section === 'dates') {
    if (!Array.isArray(value.items) || value.items.some((item) => !isRecord(item) || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string' || !item.title.trim() || typeof item.date !== 'string' || !['birthday', 'travel', 'anniversary', 'custom'].includes(String(item.type)) || !['solar', 'lunar'].includes(String(item.calendar)) || typeof item.recurring !== 'boolean' || (item.note !== undefined && typeof item.note !== 'string'))) return invalid();
    if (sanitizeAnniversaryItems(value.items).length !== value.items.length) return invalid();
    return { items: value.items };
  }
  if (value.language !== 'en' && value.language !== 'zh-CN') return invalid();
  return { language: value.language };
}

export function validatePatch(value: unknown): SyncPatch {
  if (!isRecord(value) || Object.keys(value).some((key) => !SYNC_SECTIONS.includes(key as SyncSection))) return invalid();
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, validateSection(key as SyncSection, item)]));
}

export function captureConfig(storage: Pick<Storage, 'getItem'>): SyncSnapshot {
  const get = (key: string) => storage.getItem(key);
  const json = (key: string) => { const raw = get(key); return raw === null ? null : JSON.parse(raw); };
  const values = emptySnapshot();
  const labels = json('bookmarkGroupLabels') || {};
  for (const group of ['external', 'internal'] as const) {
    const prefix = `bookmarkGroup.${group}.`;
    const hasConfig = ['useDefaultBookmarks', 'useDirectJson', 'bookmarksUrl', 'bookmarksJson'].some((key) => get(prefix + key) !== null);
    const source = !hasConfig || get(prefix + 'useDefaultBookmarks') === 'true' ? 'default' : get(prefix + 'useDirectJson') === 'true' ? 'json' : 'remote';
    const label = labels[group] || '';
    values[group] = source === 'default' && !label ? null : validateSection(group, {
      source, label,
      ...(source === 'json' ? { bookmarks: json(prefix + 'bookmarksJson') ?? [] } : source === 'remote' ? { url: get(prefix + 'bookmarksUrl') } : {}),
    });
  }
  const search = repairSearchProviderConfig({ providers: json('searchProviders'), defaultProviderId: get('defaultSearchProvider') });
  // Unmodified built-ins are bundled with the extension, including their icons.
  const providers = search.providers.filter((provider) => {
    const builtIn = DEFAULT_SEARCH_PROVIDERS.find((item) => item.id === provider.id);
    return !builtIn || !same(normalizeSearchProvider(provider), normalizeSearchProvider(builtIn));
  });
  values.search = providers.length || search.defaultProviderId !== DEFAULT_SEARCH_PROVIDER_ID
    ? validateSection('search', { providers, defaultProviderId: search.defaultProviderId }) : null;
  const urls = (get('customBackgroundMediaUrls') || '').split('\n').map((url) => url.trim()).filter(Boolean);
  values.backgrounds = urls.length ? validateSection('backgrounds', { urls }) : null;
  const items = json('anniversaryItems');
  values.dates = items !== null && !same(items, DEFAULT_ANNIVERSARIES) ? validateSection('dates', { items }) : null;
  const language = get('language');
  values.language = language ? validateSection('language', { language }) : null;
  return values;
}

// Only these keys can be restored from sync. History and caches never enter the payload.
export function configWrites(values: SyncSnapshot): Record<string, string | null> {
  const writes: Record<string, string | null> = {};
  const labels: Record<string, string> = {};
  for (const group of ['external', 'internal'] as const) {
    const value = values[group];
    const prefix = `bookmarkGroup.${group}.`;
    const source = value?.source || 'default';
    writes[prefix + 'useDefaultBookmarks'] = String(source === 'default');
    writes[prefix + 'useDirectJson'] = String(source === 'json');
    writes[prefix + 'bookmarksUrl'] = source === 'remote' ? String(value!.url) : source === 'default' ? 'default' : null;
    writes[prefix + 'bookmarksJson'] = source === 'json' ? JSON.stringify(value!.bookmarks) : null;
    labels[group] = String(value?.label || '');
  }
  writes.bookmarkGroupLabels = JSON.stringify(labels);
  const search = repairSearchProviderConfig({ providers: values.search?.providers as Parameters<typeof repairSearchProviderConfig>[0]['providers'], defaultProviderId: values.search?.defaultProviderId as string | undefined });
  writes.searchProviders = JSON.stringify(search.providers);
  writes.defaultSearchProvider = search.defaultProviderId;
  writes.customBackgroundMediaUrls = values.backgrounds ? (values.backgrounds.urls as string[]).join('\n') : null;
  writes.anniversaryItems = values.dates ? JSON.stringify(values.dates.items) : null;
  writes.language = values.language ? String(values.language.language) : null;
  return writes;
}
