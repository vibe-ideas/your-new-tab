import React from 'react';
import { getSearchProviderFallbackLabel, type SearchProvider } from '@/utils/searchProviders';
import { isHttpUrl, sanitizeHttpUrl } from '@/utils/safeUrl';
import { t } from '@/utils/i18n';
import { getSafeIconImageSrc } from '../icons';

interface SearchHubProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: (q: string) => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  selectableProviders: SearchProvider[];
  activeProvider: SearchProvider | undefined;
  activeProviderId: string;
  onSelectProvider: (id: string) => void;
}

const buildSearchUrl = (provider: SearchProvider, q: string): string => {
  const query = encodeURIComponent(q.trim());
  if (provider.urlTemplate && isHttpUrl(provider.urlTemplate.replace(/{query}/g, 'x'))) {
    return provider.urlTemplate.replace('{query}', query);
  }
  if (provider.baseUrl && isHttpUrl(provider.baseUrl)) {
    return `${provider.baseUrl}?q=${query}`;
  }
  return `https://www.google.com/search?q=${query}&udm=50`;
};

const persistLastProvider = (id: string) => {
  try { localStorage.setItem('lastSearchProvider', id); } catch { /* ignore */ }
};

export const openProviderSearch = (provider: SearchProvider, query: string, onCopied: (msg: string) => void) => {
  const url = buildSearchUrl(provider, query);
  persistLastProvider(provider.id);

  if (provider.capability === 'manual') {
    const homepage = sanitizeHttpUrl(provider.baseUrl) ||
      sanitizeHttpUrl(provider.urlTemplate?.split('?')[0]);
    if (homepage) window.open(homepage, '_blank', 'noopener,noreferrer');
    try {
      navigator.clipboard.writeText(query.trim()).catch(() => {});
      onCopied(t('copiedToClipboard'));
    } catch { /* ignore */ }
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const SearchHub: React.FC<SearchHubProps> = ({
  query, onQueryChange, onSubmit, onArrowUp, onArrowDown,
  selectableProviders, activeProvider, activeProviderId, onSelectProvider,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const activeIconSrc = getSafeIconImageSrc(activeProvider?.iconSvg);

  React.useEffect(() => {
    if (showMenu) {
      const idx = selectableProviders.findIndex((p) => p.id === activeProviderId);
      setHighlightedIndex(idx !== -1 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [showMenu, selectableProviders, activeProviderId]);

  React.useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setShowMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMenu(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  const handleSearchBoxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;

    // 1. Direct cycle search provider using Alt + ArrowUp / Alt + ArrowDown
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? -1 : 1;
      const currentIndex = selectableProviders.findIndex((p) => p.id === activeProviderId);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + dir + selectableProviders.length) % selectableProviders.length;
        onSelectProvider(selectableProviders[nextIndex].id);
      }
      return;
    }

    // 2. If the popover menu is open, handle keyboard navigation
    if (showMenu) {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev === -1 ? 0 : (prev + 1) % selectableProviders.length
        );
        return;
      }
      if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev === -1 ? selectableProviders.length - 1 : (prev - 1 + selectableProviders.length) % selectableProviders.length
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < selectableProviders.length) {
          onSelectProvider(selectableProviders[highlightedIndex].id);
        }
        setShowMenu(false);
        inputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMenu(false);
        inputRef.current?.focus();
        return;
      }
    } else {
      // 3. If the menu is closed, handle input keys (only when focus is in the input field)
      if (e.target === inputRef.current) {
        if (e.key === 'Tab') {
          e.preventDefault();
          const dir = e.shiftKey ? -1 : 1;
          const currentIndex = selectableProviders.findIndex((p) => p.id === activeProviderId);
          if (currentIndex !== -1) {
            const nextIndex = (currentIndex + dir + selectableProviders.length) % selectableProviders.length;
            onSelectProvider(selectableProviders[nextIndex].id);
          }
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit(query);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onArrowUp();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          onArrowDown();
          return;
        }
      }
    }
  };

  return (
    <div className="search-container">
      <div className="search-box" onKeyDown={handleSearchBoxKeyDown}>
        <button
          type="button"
          ref={triggerRef}
          className="search-provider-icon"
          data-provider-id={activeProviderId}
          aria-haspopup="listbox"
          aria-expanded={showMenu}
          aria-label={t('searchProviderToggleAria', { name: activeProvider?.name || t('searchProviderToggleNoMenu') })}
          onClick={() => setShowMenu((prev) => !prev)}
        >
          <span className="search-provider-trigger-icon" aria-hidden="true">
            {activeIconSrc
              ? <img src={activeIconSrc} alt="" />
              : <span className="search-provider-fallback">{getSearchProviderFallbackLabel(activeProvider)}</span>}
          </span>
          <span className="search-provider-name">{activeProvider?.name || 'Search'}</span>
          <span className="search-provider-chevron" aria-hidden="true">▾</span>
        </button>
        {showMenu && (
          <div ref={popoverRef} className="provider-popover" role="listbox">
            {selectableProviders.map((p, idx) => {
              const iconSrc = getSafeIconImageSrc(p.iconSvg);
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={p.id}
                  data-provider-id={p.id}
                  className={`provider-popover-item${p.id === activeProviderId ? ' active' : ''}${isHighlighted ? ' highlighted' : ''}`}
                  role="option"
                  aria-selected={p.id === activeProviderId}
                  onClick={() => { onSelectProvider(p.id); setShowMenu(false); }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <span className="provider-option-icon" aria-hidden="true">
                    {iconSrc
                      ? <img src={iconSrc} alt="" />
                      : <span className="search-provider-fallback">{getSearchProviderFallbackLabel(p)}</span>}
                  </span>
                  <span className="provider-option-name">{p.name}</span>
                </div>
              );
            })}
          </div>
        )}
        <input
          type="text"
          ref={inputRef}
          placeholder={t('searchInputPlaceholder')}
          className="search-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <button className="search-button" onClick={() => onSubmit(query)} aria-label={t('searchButtonAria')} type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};
