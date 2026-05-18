import { t } from '@/utils/i18n';

interface BookmarksTabProps {
  useDefaultBookmarks: boolean;
  setUseDefaultBookmarks: (v: boolean) => void;
  useDirectJson: boolean;
  setUseDirectJson: (v: boolean) => void;
  jsonInput: string;
  setJsonInput: (v: string) => void;
  inputUrl: string;
  setInputUrl: (v: string) => void;
  bookmarkModeLabel: string;
  handleFormatJson: () => void;
  handleMinifyJson: () => void;
  handleTest: () => void;
  handleRefreshBookmarks: () => void;
}

export default function BookmarksTab(props: BookmarksTabProps) {
  const {
    useDefaultBookmarks, setUseDefaultBookmarks,
    useDirectJson, setUseDirectJson,
    jsonInput, setJsonInput,
    inputUrl, setInputUrl,
    bookmarkModeLabel, handleFormatJson, handleMinifyJson,
    handleTest, handleRefreshBookmarks,
  } = props;
  const showTest = !useDefaultBookmarks || useDirectJson;

  return (
    <div role="tabpanel" data-tab-panel="bookmarks">
      <section className="config-panel">
        <div className="section-heading">
          <div>
            <h2>{t('bookmarkSection')}</h2>
            <p>{t('bookmarkSectionHint')}</p>
          </div>
          <span className="section-badge">{bookmarkModeLabel}</span>
        </div>

        <div className="toggle-grid">
          <label className={`toggle-card ${useDefaultBookmarks ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={useDefaultBookmarks}
              onChange={(e) => {
                setUseDefaultBookmarks(e.target.checked);
                if (e.target.checked) setUseDirectJson(false);
              }}
            />
            <div>
              <strong>{t('useDefaultBookmarks')}</strong>
              <span>{t('defaultBookmarksDescription')}</span>
            </div>
          </label>

          <label className={`toggle-card ${useDirectJson ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={useDirectJson}
              onChange={(e) => {
                setUseDirectJson(e.target.checked);
                if (e.target.checked) setUseDefaultBookmarks(false);
              }}
            />
            <div>
              <strong>{t('useDirectJson')}</strong>
              <span>{t('directJsonDescription')}</span>
            </div>
          </label>
        </div>

        {!useDefaultBookmarks && useDirectJson && (
          <div className="field-stack">
            <label htmlFor="bookmarksJson" className="field-label">
              {t('bookmarksJson')}
            </label>
            <textarea
              id="bookmarksJson"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={t('jsonInputPlaceholder')}
              className="input-field textarea-field json-textarea"
              rows={14}
            />
            <div className="inline-actions">
              <button onClick={handleFormatJson} className="secondary-button" type="button">
                {t('format')}
              </button>
              <button onClick={handleMinifyJson} className="secondary-button" type="button">
                {t('minify')}
              </button>
            </div>
          </div>
        )}

        {!useDefaultBookmarks && !useDirectJson && (
          <div className="field-stack">
            <label htmlFor="bookmarksUrl" className="field-label">
              {t('bookmarksUrl')}
            </label>
            <input
              id="bookmarksUrl"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder={t('urlInputPlaceholder')}
              className="input-field"
            />
            <div className="config-info">{t('urlInputTip')}</div>
          </div>
        )}

        <div className="inline-actions">
          {showTest && (
            <button onClick={handleTest} className="secondary-button" type="button">
              {t('test')}
            </button>
          )}
          <button onClick={handleRefreshBookmarks} className="ghost-button" type="button">
            {t('refreshBookmarks')}
          </button>
        </div>
      </section>
    </div>
  );
}
