import React from 'react';
import { addSearchHistory, filterHistoryByPrefix, getSearchHistory } from '@/utils/searchHistory';

export interface SearchInputApi {
  query: string;
  setQuery: (q: string) => void;
  recordHistory: (q: string) => void;
  navigateHistory: (direction: 1 | -1) => void;
  resetHistoryCursor: () => void;
}

export const useSearchInput = (): SearchInputApi => {
  const [query, setQueryState] = React.useState('');
  const [history, setHistory] = React.useState<string[]>(() => getSearchHistory());
  const cursorRef = React.useRef<number>(-1);
  const draftRef = React.useRef<string>('');

  const setQuery = React.useCallback((next: string) => {
    setQueryState(next);
  }, []);

  const resetHistoryCursor = React.useCallback(() => {
    cursorRef.current = -1;
    draftRef.current = '';
  }, []);

  const recordHistory = React.useCallback((q: string) => {
    addSearchHistory(q);
    setHistory(getSearchHistory());
    cursorRef.current = -1;
    draftRef.current = '';
    setQueryState('');
  }, []);

  const navigateHistory = React.useCallback((direction: 1 | -1) => {
    if (cursorRef.current === -1) {
      draftRef.current = query;
    }
    const candidates = filterHistoryByPrefix(history, draftRef.current);
    if (candidates.length === 0) return;
    const nextIndex = cursorRef.current + direction;
    if (nextIndex < -1) return;
    if (nextIndex >= candidates.length) {
      cursorRef.current = candidates.length - 1;
      setQueryState(candidates[candidates.length - 1]);
      return;
    }
    cursorRef.current = nextIndex;
    setQueryState(nextIndex === -1 ? draftRef.current : candidates[nextIndex]);
  }, [history, query]);

  return { query, setQuery, recordHistory, navigateHistory, resetHistoryCursor };
};
