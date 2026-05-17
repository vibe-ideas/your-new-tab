const STORAGE_KEY = 'searchHistory';
const MAX_HISTORY = 20;

export const getSearchHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch (error) {
    console.warn('Failed to read search history from localStorage', error);
    return [];
  }
};

export const addSearchHistory = (query: string): void => {
  const trimmed = query.trim();
  if (!trimmed) {
    return;
  }

  try {
    const current = getSearchHistory();
    const next = [trimmed, ...current].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Failed to write search history to localStorage', error);
  }
};

export const filterHistoryByPrefix = (history: string[], prefix: string): string[] => {
  const trimmed = prefix.trim();
  if (!trimmed) {
    return history;
  }

  const lowered = trimmed.toLowerCase();
  return history.filter((item) => item.toLowerCase().startsWith(lowered));
};
