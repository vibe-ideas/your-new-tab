import { isHttpUrl } from './safeUrl';
import { t } from './i18n';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category?: string;
  icon?: string;
}

// The editor, remote responses and cached data share this validation boundary.
export function validateBookmarks(value: unknown): { bookmarks: Bookmark[]; error: string | null } {
  if (!Array.isArray(value)) return { bookmarks: [], error: t('jsonShouldBeArray') };
  const bookmarks: Bookmark[] = [];
  const invalidRows: number[] = [];
  const ids = new Set<string>();
  value.forEach((item, index) => {
    if (!item || typeof item !== 'object' ||
      typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id.trim()) ||
      typeof item.title !== 'string' || !item.title.trim() || !isHttpUrl(item.url)) {
      invalidRows.push(index + 1);
      return;
    }
    ids.add(item.id.trim());
    bookmarks.push({
      id: item.id.trim(), title: item.title.trim(), url: item.url.trim(),
      ...(typeof item.icon === 'string' ? { icon: item.icon } : {}),
      ...(typeof item.category === 'string' ? { category: item.category } : {}),
    });
  });
  return {
    bookmarks,
    error: invalidRows.length ? t('invalidBookmarkRows', { rows: invalidRows.join(', ') }) : null,
  };
}

export function parseBookmarkJson(json: string): Bookmark[] {
  const result = validateBookmarks(JSON.parse(json));
  if (result.error) throw new Error(result.error);
  return result.bookmarks;
}
