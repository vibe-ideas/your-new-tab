import { useState } from 'react';
import { t } from '@/utils/i18n';
import { usePopupState } from './usePopupState';
import BookmarksTab from './tabs/BookmarksTab';
import SearchTab from './tabs/SearchTab';
import BackgroundsTab from './tabs/BackgroundsTab';
import './App.css';

type TabId = 'bookmarks' | 'search' | 'backgrounds';

const TABS: { id: TabId; labelKey: 'tabBookmarks' | 'tabSearch' | 'tabBackgrounds' }[] = [
  { id: 'bookmarks', labelKey: 'tabBookmarks' },
  { id: 'search', labelKey: 'tabSearch' },
  { id: 'backgrounds', labelKey: 'tabBackgrounds' },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('bookmarks');
  const state = usePopupState();

  return (
    <div className="popup-shell">
      <header className="popup-hero">
        <div className="popup-hero-copy">
          <div className="popup-badge">Your New Tab</div>
          <h1 className="popup-title">{t('title')}</h1>
          <p className="popup-subtitle">{t('popupSubtitle')}</p>
        </div>
        <div className="language-switcher">
          <button
            className={`language-button ${state.currentLanguage === 'zh-CN' ? 'active' : ''}`}
            onClick={() => state.handleLanguageChange('zh-CN')}
            type="button"
          >
            中文
          </button>
          <button
            className={`language-button ${state.currentLanguage === 'en' ? 'active' : ''}`}
            onClick={() => state.handleLanguageChange('en')}
            type="button"
          >
            English
          </button>
        </div>
      </header>

      {state.status && (
        <div className={`status-message ${state.isStatusError ? 'error' : 'success'}`}>
          {state.status}
        </div>
      )}

      <nav className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            data-tab={tab.id}
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>

      <div className="card">
        {activeTab === 'bookmarks' && (
          <BookmarksTab
            useDefaultBookmarks={state.useDefaultBookmarks}
            setUseDefaultBookmarks={state.setUseDefaultBookmarks}
            useDirectJson={state.useDirectJson}
            setUseDirectJson={state.setUseDirectJson}
            jsonInput={state.jsonInput}
            setJsonInput={state.setJsonInput}
            inputUrl={state.inputUrl}
            setInputUrl={state.setInputUrl}
            bookmarkModeLabel={state.bookmarkModeLabel}
            handleFormatJson={state.handleFormatJson}
            handleMinifyJson={state.handleMinifyJson}
            handleTest={state.handleTest}
            handleRefreshBookmarks={state.handleRefreshBookmarks}
          />
        )}
        {activeTab === 'search' && (
          <SearchTab
            providers={state.providers}
            setProviders={state.setProviders}
            defaultSearchProvider={state.defaultSearchProvider}
            setDefaultSearchProvider={state.setDefaultSearchProvider}
            handleSaveProviders={state.handleSaveProviders}
          />
        )}
        {activeTab === 'backgrounds' && (
          <BackgroundsTab
            backgroundMediaUrlsInput={state.backgroundMediaUrlsInput}
            setBackgroundMediaUrlsInput={state.setBackgroundMediaUrlsInput}
          />
        )}
      </div>

      <footer className="action-footer">
        <div className="action-grid">
          <button id="saveConfigButton" onClick={state.handleSave} className="primary-button" type="button">
            {t('save')}
          </button>
          <button onClick={state.handleReset} className="secondary-button" type="button">
            {t('reset')}
          </button>
        </div>

        <div className="config-summary-card">
          <div className="label">{t('currentConfig')}</div>
          <code>
            {state.useDefaultBookmarks
              ? t('builtInBookmarks')
              : state.useDirectJson
                ? t('directJsonLabel')
                : t('urlLabel') + state.bookmarksUrl}
          </code>
        </div>
      </footer>

      <p className="read-the-docs">
        {state.useDefaultBookmarks
          ? t('defaultBookmarksDescription')
          : state.useDirectJson
            ? t('directJsonDescription')
            : t('urlBookmarksDescription')}
      </p>
    </div>
  );
}

export default App;
