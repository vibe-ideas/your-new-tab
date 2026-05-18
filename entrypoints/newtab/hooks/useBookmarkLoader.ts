import React from 'react';
import {
  ACTIVE_GROUP_STORAGE_KEY,
  BOOKMARK_GROUP_LABELS_STORAGE_KEY,
  BOOKMARK_GROUP_REFRESH_SIGNAL_KEY,
  type BookmarkGroupId,
  type BookmarkGroupLabels,
  isBookmarkGroupKey,
  readActiveBookmarkGroup,
  readBookmarkGroupCache,
  readBookmarkGroupConfig,
  readBookmarkGroupLabels,
  writeActiveBookmarkGroup,
  writeBookmarkGroupCache,
} from '@/utils/bookmarkGroups';
import { DEFAULT_BOOKMARKS } from '@/utils/defaultBookmarks';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category?: string;
  icon?: string;
}

export interface BookmarkLoaderApi {
  bookmarks: Bookmark[];
  activeGroup: BookmarkGroupId;
  groupLabels: BookmarkGroupLabels;
  setActiveGroup: (group: BookmarkGroupId) => void;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const loadForGroup = async (group: BookmarkGroupId, useCache: boolean): Promise<Bookmark[]> => {
  const config = readBookmarkGroupConfig(group);

  if (config.useDefaultBookmarks) return DEFAULT_BOOKMARKS as Bookmark[];

  if (config.useDirectJson) {
    try {
      const parsed: unknown = JSON.parse(config.bookmarksJson || '[]');
      if (Array.isArray(parsed)) {
        writeBookmarkGroupCache(group, parsed);
        return parsed as Bookmark[];
      }
    } catch (error) {
      console.error('Failed to parse direct JSON bookmarks:', error);
    }
    return DEFAULT_BOOKMARKS as Bookmark[];
  }

  if (useCache) {
    const cache = readBookmarkGroupCache<Bookmark[]>(group);
    if (cache && Array.isArray(cache.bookmarks)) {
      const sameDay = new Date(cache.timestamp).toDateString() === new Date().toDateString();
      if (sameDay) return cache.bookmarks;
    }
  }

  if (!config.bookmarksUrl) return DEFAULT_BOOKMARKS as Bookmark[];

  try {
    const response = await fetch(config.bookmarksUrl);
    if (!response.ok) return DEFAULT_BOOKMARKS as Bookmark[];
    const data: Bookmark[] = await response.json();
    writeBookmarkGroupCache(group, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    return DEFAULT_BOOKMARKS as Bookmark[];
  }
};

export const useBookmarkLoader = (): BookmarkLoaderApi => {
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);
  const [activeGroup, setActiveGroupState] = React.useState<BookmarkGroupId>(() => readActiveBookmarkGroup());
  const [groupLabels, setGroupLabels] = React.useState<BookmarkGroupLabels>(() => readBookmarkGroupLabels());

  const setActiveGroup = React.useCallback((group: BookmarkGroupId) => {
    setActiveGroupState((current) => {
      if (current === group) return current;
      writeActiveBookmarkGroup(group);
      return group;
    });
  }, []);

  const loadActive = React.useCallback(async (useCache: boolean) => {
    const next = await loadForGroup(activeGroup, useCache);
    setBookmarks(next);
  }, [activeGroup]);

  React.useEffect(() => {
    void loadActive(true);
  }, [loadActive]);

  React.useEffect(() => {
    const checkAndRefresh = () => {
      const cache = readBookmarkGroupCache<Bookmark[]>(activeGroup);
      if (!cache || Date.now() - cache.timestamp > ONE_DAY_MS) {
        void loadActive(false);
      }
    };
    checkAndRefresh();
    const id = setInterval(checkAndRefresh, ONE_DAY_MS);
    return () => clearInterval(id);
  }, [activeGroup, loadActive]);

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      const key = event.key || '';
      if (key === ACTIVE_GROUP_STORAGE_KEY) {
        setActiveGroupState(readActiveBookmarkGroup());
      } else if (key === BOOKMARK_GROUP_LABELS_STORAGE_KEY) {
        setGroupLabels(readBookmarkGroupLabels());
      } else if (key === BOOKMARK_GROUP_REFRESH_SIGNAL_KEY || isBookmarkGroupKey(key)) {
        setGroupLabels(readBookmarkGroupLabels());
        void loadActive(false);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadActive]);

  return { bookmarks, activeGroup, groupLabels, setActiveGroup };
};
