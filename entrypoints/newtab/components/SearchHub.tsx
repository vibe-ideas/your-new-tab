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
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const activeIconSrc = getSafeIconImageSrc(activeProvider?.iconSvg);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') { onSubmit(query); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); onArrowUp(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); onArrowDown(); }
  };

  return (
    <div className="search-container">
      <div className="search-box">
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
            {selectableProviders.map((p) => {
              const iconSrc = getSafeIconImageSrc(p.iconSvg);
              return (
                <div
                  key={p.id}
                  data-provider-id={p.id}
                  className={`provider-popover-item${p.id === activeProviderId ? ' active' : ''}`}
                  role="option"
                  aria-selected={p.id === activeProviderId}
                  onClick={() => { onSelectProvider(p.id); setShowMenu(false); }}
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
          placeholder={t('searchInputPlaceholder')}
          className="search-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
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
