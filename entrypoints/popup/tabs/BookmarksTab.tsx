import { useRef } from 'react';
import { t } from '@/utils/i18n';
import {
  BOOKMARK_GROUP_IDS,
  type BookmarkGroupId,
  type BookmarkGroupLabels,
} from '@/utils/bookmarkGroups';

interface BookmarksTabProps {
  activeBookmarkGroup: BookmarkGroupId;
  setActiveBookmarkGroup: (group: BookmarkGroupId) => void;
  groupLabels: BookmarkGroupLabels;
  setGroupLabel: (group: BookmarkGroupId, label: string) => void;
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
  handleImportJsonFile: (file: File) => void;
  handleExportJsonFile: () => void;
  handleTest: () => void;
  handleRefreshBookmarks: () => void;
}

const defaultLabelKey = (group: BookmarkGroupId): 'bookmarkGroupExternal' | 'bookmarkGroupInternal' =>
  group === 'external' ? 'bookmarkGroupExternal' : 'bookmarkGroupInternal';

export const resolveGroupDisplayLabel = (
  group: BookmarkGroupId,
  labels: BookmarkGroupLabels,
): string => labels[group]?.trim() || t(defaultLabelKey(group));

export default function BookmarksTab(props: BookmarksTabProps) {
  const {
    activeBookmarkGroup, setActiveBookmarkGroup,
    groupLabels, setGroupLabel,
    useDefaultBookmarks, setUseDefaultBookmarks,
    useDirectJson, setUseDirectJson,
    jsonInput, setJsonInput,
    inputUrl, setInputUrl,
    bookmarkModeLabel, handleFormatJson, handleMinifyJson,
    handleImportJsonFile, handleExportJsonFile, handleTest, handleRefreshBookmarks,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showTest = !useDefaultBookmarks || useDirectJson;
  const activeLabelValue = groupLabels[activeBookmarkGroup] ?? '';

  return (
    <div role="tabpanel" data-tab-panel="bookmarks">
      <section className="config-panel">
        <div className="section-heading">
          <div>
            <h2>{t('bookmarkSection')}</h2>
            <p>{t('bookmarkGroupSectionHint')}</p>
          </div>
          <span className="section-badge">{bookmarkModeLabel}</span>
        </div>

        <div className="bookmark-group-switcher" role="tablist" aria-label={t('bookmarkGroupSelectorLabel')}>
          {BOOKMARK_GROUP_IDS.map((group) => (
            <button
              key={group}
              type="button"
              role="tab"
              aria-selected={activeBookmarkGroup === group}
              className={`bookmark-group-button${activeBookmarkGroup === group ? ' active' : ''}`}
              onClick={() => setActiveBookmarkGroup(group)}
            >
              {resolveGroupDisplayLabel(group, groupLabels)}
            </button>
          ))}
        </div>

        <div className="field-stack bookmark-group-rename">
          <label htmlFor="bookmarkGroupLabel" className="field-label">
            {t('bookmarkGroupLabelField')}
          </label>
          <input
            id="bookmarkGroupLabel"
            type="text"
            value={activeLabelValue}
            onChange={(e) => setGroupLabel(activeBookmarkGroup, e.target.value)}
            placeholder={t(defaultLabelKey(activeBookmarkGroup))}
            maxLength={24}
            className="input-field"
          />
          <div className="config-info">{t('bookmarkGroupLabelHint')}</div>
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportJsonFile(file);
                  e.target.value = '';
                }}
              />
              <button onClick={() => fileInputRef.current?.click()} className="secondary-button" type="button">
                {t('importFile')}
              </button>
              <button onClick={handleExportJsonFile} className="secondary-button" type="button">
                {t('exportFile')}
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
