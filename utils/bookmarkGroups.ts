export const BOOKMARK_GROUP_IDS = ['external', 'internal'] as const;
export type BookmarkGroupId = (typeof BOOKMARK_GROUP_IDS)[number];

export const DEFAULT_BOOKMARK_GROUP: BookmarkGroupId = 'external';
export const ACTIVE_GROUP_STORAGE_KEY = 'activeBookmarkGroup';
export const BOOKMARK_GROUP_REFRESH_SIGNAL_KEY = 'bookmarksRefreshSignal';
export const BOOKMARK_GROUP_LABELS_STORAGE_KEY = 'bookmarkGroupLabels';
const MIGRATION_FLAG_KEY = 'bookmarkGroupsMigratedV1';

export type BookmarkGroupLabels = Record<BookmarkGroupId, string>;

export const EMPTY_BOOKMARK_GROUP_LABELS: BookmarkGroupLabels = { external: '', internal: '' };

export interface BookmarkGroupConfig {
  useDefaultBookmarks: boolean;
  useDirectJson: boolean;
  bookmarksUrl: string;
  bookmarksJson: string;
}

export interface BookmarkCacheEntry<T = unknown> {
  bookmarks: T;
  timestamp: number;
}

interface GroupKeys {
  useDefault: string;
  useDirectJson: string;
  url: string;
  json: string;
  data: string;
}

const LEGACY_KEYS: GroupKeys = {
  useDefault: 'useDefaultBookmarks',
  useDirectJson: 'useDirectJson',
  url: 'bookmarksUrl',
  json: 'bookmarksJson',
  data: 'bookmarksData',
};

const groupKeys = (group: BookmarkGroupId): GroupKeys => ({
  useDefault: `bookmarkGroup.${group}.useDefaultBookmarks`,
  useDirectJson: `bookmarkGroup.${group}.useDirectJson`,
  url: `bookmarkGroup.${group}.bookmarksUrl`,
  json: `bookmarkGroup.${group}.bookmarksJson`,
  data: `bookmarkGroup.${group}.bookmarksData`,
});

export const isBookmarkGroupId = (value: unknown): value is BookmarkGroupId =>
  typeof value === 'string' && (BOOKMARK_GROUP_IDS as readonly string[]).includes(value);

export const isBookmarkGroupKey = (key: string | null | undefined): boolean => {
  if (!key) return false;
  if (key === ACTIVE_GROUP_STORAGE_KEY || key === BOOKMARK_GROUP_REFRESH_SIGNAL_KEY) return true;
  if (key === BOOKMARK_GROUP_LABELS_STORAGE_KEY) return true;
  return key.startsWith('bookmarkGroup.');
};

const safeRead = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage`, error);
    return null;
  }
};

const safeWrite = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to write ${key} to localStorage`, error);
  }
};

const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove ${key} from localStorage`, error);
  }
};

const migrateLegacyKeysIfNeeded = () => {
  if (safeRead(MIGRATION_FLAG_KEY) === 'true') return;

  const target = groupKeys(DEFAULT_BOOKMARK_GROUP);
  const targetAlreadyHasData = !!safeRead(target.useDefault) || !!safeRead(target.useDirectJson) || !!safeRead(target.url) || !!safeRead(target.json) || !!safeRead(target.data);

  if (!targetAlreadyHasData) {
    const pairs: [keyof GroupKeys, string][] = [
      ['useDefault', LEGACY_KEYS.useDefault],
      ['useDirectJson', LEGACY_KEYS.useDirectJson],
      ['url', LEGACY_KEYS.url],
      ['json', LEGACY_KEYS.json],
      ['data', LEGACY_KEYS.data],
    ];
    for (const [field, legacyKey] of pairs) {
      const value = safeRead(legacyKey);
      if (value !== null) safeWrite(target[field], value);
    }
  }

  safeWrite(MIGRATION_FLAG_KEY, 'true');
  for (const legacyKey of Object.values(LEGACY_KEYS)) safeRemove(legacyKey);
};

export const readActiveBookmarkGroup = (): BookmarkGroupId => {
  migrateLegacyKeysIfNeeded();
  const stored = safeRead(ACTIVE_GROUP_STORAGE_KEY);
  return isBookmarkGroupId(stored) ? stored : DEFAULT_BOOKMARK_GROUP;
};

export const writeActiveBookmarkGroup = (group: BookmarkGroupId) => {
  safeWrite(ACTIVE_GROUP_STORAGE_KEY, group);
};

export const readBookmarkGroupConfig = (group: BookmarkGroupId): BookmarkGroupConfig => {
  migrateLegacyKeysIfNeeded();
  const keys = groupKeys(group);
  const useDefaultRaw = safeRead(keys.useDefault);
  const useDirectJsonRaw = safeRead(keys.useDirectJson);
  const url = safeRead(keys.url) ?? '';
  const json = safeRead(keys.json) ?? '';

  const stored = useDefaultRaw !== null || useDirectJsonRaw !== null || url || json;
  if (!stored) {
    return { useDefaultBookmarks: true, useDirectJson: false, bookmarksUrl: '', bookmarksJson: '' };
  }

  return {
    useDefaultBookmarks: useDefaultRaw === 'true',
    useDirectJson: useDirectJsonRaw === 'true',
    bookmarksUrl: url === 'default' ? '' : url,
    bookmarksJson: json,
  };
};

export const writeBookmarkGroupConfig = (group: BookmarkGroupId, config: BookmarkGroupConfig) => {
  const keys = groupKeys(group);
  safeWrite(keys.useDefault, String(config.useDefaultBookmarks));
  safeWrite(keys.useDirectJson, String(config.useDirectJson));

  if (config.useDefaultBookmarks) {
    safeWrite(keys.url, 'default');
    safeRemove(keys.json);
  } else if (config.useDirectJson) {
    safeRemove(keys.url);
    safeWrite(keys.json, config.bookmarksJson);
  } else {
    safeWrite(keys.url, config.bookmarksUrl);
    safeRemove(keys.json);
  }
};

export const resetBookmarkGroupConfig = (group: BookmarkGroupId) => {
  const keys = groupKeys(group);
  safeWrite(keys.useDefault, 'true');
  safeWrite(keys.useDirectJson, 'false');
  safeWrite(keys.url, 'default');
  safeRemove(keys.json);
  safeRemove(keys.data);
};

export const readBookmarkGroupCache = <T>(group: BookmarkGroupId): BookmarkCacheEntry<T> | null => {
  const raw = safeRead(groupKeys(group).data);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookmarkCacheEntry<T>;
  } catch (error) {
    console.warn(`Failed to parse bookmark cache for ${group}`, error);
    return null;
  }
};

export const writeBookmarkGroupCache = <T>(group: BookmarkGroupId, bookmarks: T) => {
  safeWrite(groupKeys(group).data, JSON.stringify({ bookmarks, timestamp: Date.now() }));
};

export const clearBookmarkGroupCache = (group: BookmarkGroupId) => {
  safeRemove(groupKeys(group).data);
};

export const broadcastBookmarkRefresh = () => {
  safeWrite(BOOKMARK_GROUP_REFRESH_SIGNAL_KEY, Date.now().toString());
};

const sanitizeLabel = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 24);
};

export const readBookmarkGroupLabels = (): BookmarkGroupLabels => {
  const raw = safeRead(BOOKMARK_GROUP_LABELS_STORAGE_KEY);
  if (!raw) return { ...EMPTY_BOOKMARK_GROUP_LABELS };
  try {
    const parsed = JSON.parse(raw) as Partial<BookmarkGroupLabels>;
    return {
      external: sanitizeLabel(parsed?.external),
      internal: sanitizeLabel(parsed?.internal),
    };
  } catch (error) {
    console.warn('Failed to parse bookmark group labels', error);
    return { ...EMPTY_BOOKMARK_GROUP_LABELS };
  }
};

export const writeBookmarkGroupLabels = (labels: BookmarkGroupLabels) => {
  const cleaned: BookmarkGroupLabels = {
    external: sanitizeLabel(labels.external),
    internal: sanitizeLabel(labels.internal),
  };
  if (!cleaned.external && !cleaned.internal) {
    safeRemove(BOOKMARK_GROUP_LABELS_STORAGE_KEY);
    return;
  }
  safeWrite(BOOKMARK_GROUP_LABELS_STORAGE_KEY, JSON.stringify(cleaned));
};

export const clearBookmarkGroupLabels = () => {
  safeRemove(BOOKMARK_GROUP_LABELS_STORAGE_KEY);
};
