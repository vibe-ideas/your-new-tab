import React from 'react';
import { createRoot } from 'react-dom/client';
import './newtab.css';
import { t } from '../../utils/i18n';
import { writeActiveBookmarkGroup } from '../../utils/bookmarkGroups';
import { NewTabErrorBoundary } from './ErrorBoundary';
import { useClock } from './hooks/useClock';
import { useToast } from './hooks/useToast';
import { useBookmarkLoader } from './hooks/useBookmarkLoader';
import { useBackgroundMedia } from './hooks/useBackgroundMedia';
import { useSearchProviders } from './hooks/useSearchProviders';
import { useSearchInput } from './hooks/useSearchInput';
import { BookmarkGroupToggle } from './components/BookmarkGroupToggle';
import { TimeDisplay } from './components/TimeDisplay';
import { SearchHub, openProviderSearch } from './components/SearchHub';
import { ShortcutsGrid } from './components/ShortcutsGrid';
import { BackgroundLayer } from './components/BackgroundLayer';
import { WindmillButton } from './components/WindmillButton';
import { Toast } from './components/Toast';

const NewTab: React.FC = () => {
  const now = useClock();
  const toast = useToast();
  const bookmarks = useBookmarkLoader();
  const background = useBackgroundMedia();
  const providers = useSearchProviders();
  const search = useSearchInput();

  React.useEffect(() => {
    document.title = t('newtabPageTitle');
  }, []);

  const handleSubmit = (rawQuery: string) => {
    if (!rawQuery.trim()) return;
    const provider = providers.activeProvider;
    if (!provider) return;
    search.recordHistory(rawQuery);
    openProviderSearch(provider, rawQuery, toast.show);
  };

  const handleSelectGroup = (group: typeof bookmarks.activeGroup) => {
    if (group === bookmarks.activeGroup) return;
    bookmarks.setActiveGroup(group);
    writeActiveBookmarkGroup(group);
  };

  const containerClass = background.media ? 'newtab-container with-background' : 'newtab-container';

  return (
    <div className={containerClass}>
      <BackgroundLayer
        media={background.media}
        videoRef={background.videoRef}
        onVideoReady={background.ensureVideoPlayback}
        onError={background.handleError}
      />
      <BookmarkGroupToggle
        activeGroup={bookmarks.activeGroup}
        groupLabels={bookmarks.groupLabels}
        onSelect={handleSelectGroup}
      />
      <TimeDisplay now={now} />
      <SearchHub
        query={search.query}
        onQueryChange={(q) => { search.setQuery(q); search.resetHistoryCursor(); }}
        onSubmit={handleSubmit}
        onArrowUp={() => search.navigateHistory(1)}
        onArrowDown={() => search.navigateHistory(-1)}
        selectableProviders={providers.selectableProviders}
        activeProvider={providers.activeProvider}
        activeProviderId={providers.activeProviderId}
        onSelectProvider={providers.selectProvider}
      />
      <ShortcutsGrid bookmarks={bookmarks.bookmarks} />
      <Toast message={toast.message} />
      <WindmillButton onClick={background.switchMedia} loading={background.isSwitching} />
    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <NewTabErrorBoundary>
      <NewTab />
    </NewTabErrorBoundary>
  );
}
