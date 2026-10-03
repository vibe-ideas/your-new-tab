import React from 'react';
import {
  ACTIVE_GROUP_STORAGE_KEY,
  BOOKMARK_GROUP_LABELS_STORAGE_KEY,
  BOOKMARK_GROUP_REFRESH_SIGNAL_KEY,
  type BookmarkGroupId,
  type BookmarkGroupLabels,
  readActiveBookmarkGroup,
  readBookmarkGroupCache,
  readBookmarkGroupConfig,
  readBookmarkGroupLabels,
  writeActiveBookmarkGroup,
  writeBookmarkGroupCache,
} from '@/utils/bookmarkGroups';
import { DEFAULT_BOOKMARKS } from '@/utils/defaultBookmarks';
import { validateBookmarks, type Bookmark } from '@/utils/bookmarks';
import { t } from '@/utils/i18n';

export type { Bookmark } from '@/utils/bookmarks';

export interface BookmarkLoaderApi {
  bookmarks: Bookmark[];
  error: string | null;
  activeGroup: BookmarkGroupId;
  groupLabels: BookmarkGroupLabels;
  setActiveGroup: (group: BookmarkGroupId) => void;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10000;

function readValidCache(group: BookmarkGroupId) {
  const cache = readBookmarkGroupCache(group);
  if (!cache) return null;
  const result = validateBookmarks(cache.bookmarks);
  return result.error ? null : { ...cache, bookmarks: result.bookmarks };
}

async function loadForGroup(group: BookmarkGroupId, useCache: boolean, signal: AbortSignal) {
  const config = readBookmarkGroupConfig(group);
  const cache = readValidCache(group);
  const fallback = cache?.bookmarks ?? DEFAULT_BOOKMARKS;
  if (config.useDefaultBookmarks) return { bookmarks: DEFAULT_BOOKMARKS, error: null };
  try {
    let data: unknown;
    if (config.useDirectJson) {
      data = JSON.parse(config.bookmarksJson || '[]');
    } else {
      if (useCache && cache && cache.sourceUrl === config.bookmarksUrl && new Date(cache.timestamp).toDateString() === new Date().toDateString()) {
        return { bookmarks: cache.bookmarks, error: null };
      }
      if (!config.bookmarksUrl) return { bookmarks: fallback, error: null };
      const response = await fetch(config.bookmarksUrl, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    }
    // A superseded request must neither render nor overwrite a newer cache.
    signal.throwIfAborted();
    const result = validateBookmarks(data);
    if (!result.error) writeBookmarkGroupCache(group, result.bookmarks, config.useDirectJson ? undefined : config.bookmarksUrl);
    return {
      bookmarks: result.error && result.bookmarks.length === 0 ? fallback : result.bookmarks,
      error: result.error,
    };
  } catch (error) {
    if (signal.aborted) throw error;
    console.warn('Failed to load bookmarks', error);
    return { bookmarks: fallback, error: t('bookmarksLoadFailed') };
  }
}

export const useBookmarkLoader = (): BookmarkLoaderApi => {
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>(DEFAULT_BOOKMARKS);
  const [error, setError] = React.useState<string | null>(null);
  const [activeGroup, setActiveGroupState] = React.useState<BookmarkGroupId>(() => readActiveBookmarkGroup());
  const [groupLabels, setGroupLabels] = React.useState<BookmarkGroupLabels>(() => readBookmarkGroupLabels());

  const setActiveGroup = React.useCallback((group: BookmarkGroupId) => {
    writeActiveBookmarkGroup(group);
    setActiveGroupState(group);
  }, []);

  React.useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const load = async (useCache: boolean) => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => request.abort(), FETCH_TIMEOUT_MS);
      try {
        const result = await loadForGroup(activeGroup, useCache, request.signal);
        if (active && controller === request) {
          setBookmarks(result.bookmarks);
          setError(result.error);
        }
      } catch {
        if (active && controller === request) {
          setBookmarks(readValidCache(activeGroup)?.bookmarks ?? DEFAULT_BOOKMARKS);
          setError(t('bookmarksLoadFailed'));
        }
      } finally {
        clearTimeout(timeout);
      }
    };
    const handleStorage = (event: StorageEvent) => {
      const key = event.key;
      if (key === ACTIVE_GROUP_STORAGE_KEY) {
        setActiveGroupState(readActiveBookmarkGroup());
      } else if (key === BOOKMARK_GROUP_LABELS_STORAGE_KEY) {
        setGroupLabels(readBookmarkGroupLabels());
      } else if (key === `bookmarkGroup.${activeGroup}.bookmarksData`) {
        // Cache propagation is a read, never a new fetch/write cycle.
        const config = readBookmarkGroupConfig(activeGroup);
        const cache = readValidCache(activeGroup);
        if (event.newValue && cache && cache.sourceUrl === config.bookmarksUrl && !config.useDefaultBookmarks && !config.useDirectJson) {
          setBookmarks(cache.bookmarks);
          setError(null);
        }
      } else if (key === BOOKMARK_GROUP_REFRESH_SIGNAL_KEY || key?.startsWith(`bookmarkGroup.${activeGroup}.`)) {
        // A save writes several keys synchronously; load the completed config once.
        controller?.abort();
        controller = undefined;
        clearTimeout(scheduled);
        scheduled = setTimeout(() => { void load(false); }, 0);
      }
    };
    void load(true);
    const interval = setInterval(() => { void load(true); }, ONE_DAY_MS);
    window.addEventListener('storage', handleStorage);
    return () => {
      active = false;
      controller?.abort();
      clearTimeout(scheduled);
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [activeGroup]);

  return { bookmarks, error, activeGroup, groupLabels, setActiveGroup };
};
