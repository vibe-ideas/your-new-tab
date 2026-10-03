import { useRef } from 'react';
import { t } from '@/utils/i18n';
import { DEFAULT_BOOKMARKS } from '@/utils/defaultBookmarks';
import { BOOKMARK_GROUP_IDS } from '@/utils/bookmarkGroups';
import { isBuiltInSearchProvider, type SearchProvider } from '@/utils/searchProviders';
import { createAnniversaryItem, type AnniversaryType, type AnniversaryCalendar } from '@/utils/anniversaries';
import { getSafeIconImageSrc } from '../newtab/icons';
import { detectMediaType } from '../newtab/hooks/backgroundMediaHelpers';
import { isHttpUrl } from '@/utils/safeUrl';
import { s } from './copy';
import { mediaLines, type SettingsState, type BookmarkSource } from './useSettingsState';

type Props = { state: SettingsState };
export function FieldError({ state, field }: Props & { field: string }) {
  const error = state.errorFor(field);
  return error ? <p id={`${field}-error`} className="field-error" role="alert">{error}</p> : null;
}
function aria(state: SettingsState, field: string) {
  return { 'aria-invalid': Boolean(state.errorFor(field)), 'aria-describedby': state.errorFor(field) ? `${field}-error` : undefined };
}

export function SearchSection({ state }: Props) {
  const { providers, defaultProvider } = state.draft;
  const updateProvider = (index: number, patch: Partial<SearchProvider>) => {
    const next = providers.map((provider, i) => i === index ? { ...provider, ...patch } : provider);
    const defaultId = next.find((provider) => provider.id === defaultProvider && provider.enabled !== false)?.id || next.find((provider) => provider.enabled !== false)!.id;
    state.update({ providers: next, defaultProvider: defaultId });
  };
  return <>
    <section className="settings-section">
      <div className="field-stack">
        <label className="field-label" htmlFor="defaultSearchProvider">{s('defaultProvider')}</label>
        <select id="defaultSearchProvider" className="input-field default-select" value={defaultProvider} onChange={(e) => state.update({ defaultProvider: e.target.value })} aria-describedby="defaultHint">
          {providers.filter((p) => p.enabled !== false).map((p) => <option key={p.id} value={p.id}>{p.name || s('unnamed')}</option>)}
        </select>
        <p id="defaultHint" className="help-text">{s('defaultHint')}</p>
      </div>
    </section>
    <section className="settings-section">
      <div className="section-heading"><div><h2>{s('engines')}</h2><p>{s('enginesHint')}</p></div><span className="count-label">{providers.length}</span></div>
      <div className="engine-list">
        {providers.map((provider, index) => {
          const icon = getSafeIconImageSrc(provider.iconSvg);
          const builtIn = isBuiltInSearchProvider(provider.id);
          const nameId = `provider-name-${provider.id}`;
          const urlId = `provider-url-${provider.id}`;
          return <details className="provider-card" key={provider.id} data-provider-id={provider.id}>
            <summary className="item-summary">
              <span className="provider-avatar" aria-hidden="true">{icon ? <img src={icon} alt="" /> : (provider.name || 'S').charAt(0)}</span>
              <span className="item-copy"><strong>{provider.name || s('unnamed')}</strong><span className="item-meta">{s(builtIn ? 'builtIn' : 'custom')}{provider.requiresLogin && ` · ${s('login')}`}{provider.enabled === false && ` · ${s('disabled')}`}</span></span>
              {provider.id === defaultProvider && <span className="badge badge-blue">{s('default')}</span>}
              <span className="edit-label">{s('edit')} <span aria-hidden="true">⌄</span></span>
            </summary>
            <div className="item-editor">
              <div className="field-stack"><label className="field-label" htmlFor={nameId}>{s('name')}</label>
                <input id={nameId} className="input-field" value={provider.name} {...aria(state, nameId)} onChange={(e) => { updateProvider(index, { name: e.target.value }); state.clearError(nameId); }} /><FieldError state={state} field={nameId} />
              </div>
              <div className="field-stack"><label className="field-label" htmlFor={urlId}>{s('template')}</label>
                <input id={urlId} className="input-field mono" value={provider.urlTemplate || ''} {...aria(state, urlId)} onChange={(e) => { updateProvider(index, { urlTemplate: e.target.value }); state.clearError(urlId); }} spellCheck={false} />
                <FieldError state={state} field={urlId} /><p className="help-text">{s('templateHint')}</p>
              </div>
              {!builtIn && <div className="settings-row">
                <label className="checkbox-label"><input type="checkbox" checked={provider.enabled !== false} onChange={(e) => updateProvider(index, { enabled: e.target.checked })} />{s('enabled')}</label>
                <button className="danger-button" type="button" onClick={() => {
                  const next = providers.filter((p) => p.id !== provider.id);
                  state.update({ providers: next, defaultProvider: defaultProvider === provider.id ? next.find((p) => p.enabled !== false)!.id : defaultProvider });
                }}>{s('remove')}</button>
              </div>}
            </div>
          </details>;
        })}
      </div>
      <button className="secondary-button add-button" type="button" onClick={() => {
        const id = `custom_${Date.now()}`;
        state.update({ providers: [...providers, { id, name: '', urlTemplate: '', capability: 'experimental', enabled: true }] });
        state.focusField(`provider-name-${id}`);
      }}><span aria-hidden="true">＋</span> {s('addProvider')}</button>
    </section>
  </>;
}

export function BookmarksSection({ state }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const { group } = state;
  const sources: { id: BookmarkSource; title: 'builtInBookmarks' | 'json' | 'remote'; hint: 'builtInHint' | 'jsonHint' | 'remoteHint' }[] = [
    { id: 'default', title: 'builtInBookmarks', hint: 'builtInHint' }, { id: 'json', title: 'json', hint: 'jsonHint' }, { id: 'remote', title: 'remote', hint: 'remoteHint' },
  ];
  return <>
    <section className="settings-section">
      <div className="section-heading"><h2>{s('groups')}</h2></div>
      <div className="segmented-control" role="group" aria-label={s('groups')}>
        {BOOKMARK_GROUP_IDS.map((id) => <button type="button" className={`bookmark-group-button${state.activeGroup === id ? ' active' : ''}`} aria-pressed={state.activeGroup === id} key={id} onClick={() => state.selectGroup(id)}>{state.draft.groups[id].label.trim() || s(id)}</button>)}
      </div>
      <div className="field-stack group-name-field"><label className="field-label" htmlFor="bookmarkGroupLabel">{s('groupName')}</label>
        <input id="bookmarkGroupLabel" className="input-field" value={group.label} placeholder={s(state.activeGroup)} maxLength={24} onChange={(e) => state.updateGroup({ label: e.target.value })} aria-describedby="groupNameHint" />
        <p id="groupNameHint" className="help-text">{s('groupHint')}</p>
      </div>
    </section>
    <section className="settings-section">
      <fieldset className="source-fieldset"><legend className="field-label">{s('source')}</legend>
        <div className="source-options">{sources.map((source) => <label key={source.id} className={`source-option${group.source === source.id ? ' active' : ''}`}>
          <input type="radio" name="bookmarkSource" value={source.id} checked={group.source === source.id} onChange={() => state.updateGroup({ source: source.id })} />
          <span><strong>{s(source.title)}</strong><span className="help-text">{s(source.hint)}</span></span>
        </label>)}</div>
      </fieldset>
      {group.source === 'default' && <div className="bookmark-preview"><p className="help-text">{s('preview', { count: DEFAULT_BOOKMARKS.length })}</p><div className="preview-items">{DEFAULT_BOOKMARKS.map((bookmark) => <span className="preview-item" key={bookmark.id}><span className="preview-dot" aria-hidden="true" />{bookmark.title}</span>)}</div></div>}
      {group.source === 'json' && <div className="field-stack">
        <div className="settings-row"><label className="field-label" htmlFor="bookmarksJson">{s('bookmarkData')}</label><div className="json-toolbar">
          <button className="text-button" type="button" onClick={() => state.formatJson()}>{t('format')}</button>
          <button className="text-button" type="button" onClick={() => state.formatJson(true)}>{t('minify')}</button>
          <button className="text-button" type="button" onClick={() => fileInput.current?.click()}>{t('importFile')}</button>
          <button className="text-button" type="button" onClick={state.exportJson}>{t('exportFile')}</button>
        </div></div>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) void state.importJson(file); e.target.value = ''; }} />
        <textarea id="bookmarksJson" className="input-field json-textarea" rows={10} spellCheck={false} placeholder={'[\n  {"id": "example", "title": "Example", "url": "https://example.com"}\n]'} value={group.json} onChange={(e) => state.updateGroup({ json: e.target.value })} {...aria(state, 'bookmarksJson')} />
        <FieldError state={state} field="bookmarksJson" />
      </div>}
      {group.source === 'remote' && <div className="field-stack"><label className="field-label" htmlFor="bookmarksUrl">{s('remoteUrl')}</label>
        <input id="bookmarksUrl" className="input-field mono" value={group.url} placeholder="https://example.com/bookmarks.json" onChange={(e) => state.updateGroup({ url: e.target.value })} {...aria(state, 'bookmarksUrl')} />
        <FieldError state={state} field="bookmarksUrl" /><p className="help-text">{s('remoteHelp')}</p>
      </div>}
      {group.source !== 'default' && <div className="inline-actions"><button type="button" className="secondary-button" disabled={state.testing} onClick={() => void state.testBookmarks()}>{s(state.testing ? 'testing' : group.source === 'json' ? 'validate' : 'testUrl')}</button></div>}
    </section>
    <div className="settings-row refresh-row"><div className="row-copy"><p className="help-text">{s('refreshHint')}</p></div><button type="button" className="text-button" onClick={state.refresh}>{s('refresh')}</button></div>
  </>;
}

export function BackgroundsSection({ state }: Props) {
  const lines = mediaLines(state.draft.backgroundUrls);
  const invalid = lines.filter(({ url }) => !isHttpUrl(url));
  const inlineError = invalid.length ? s('invalidMedia', { rows: invalid.map(({ line }) => line).join(', ') }) : state.errorFor('backgroundMediaUrls');
  return <>
    <div className="mode-summary"><span className="mode-icon" aria-hidden="true">◩</span><div><span className="eyebrow">{s('backgroundMode')}</span><h2>{lines.length ? s('customBackground', { count: lines.length }) : s('daily')}</h2><p className="help-text">{s(lines.length ? 'customBackgroundHint' : 'dailyHint')}</p></div></div>
    <section className="settings-section">
      <div className="field-stack"><label className="field-label" htmlFor="backgroundMediaUrls">{s('mediaUrls')}</label>
        <textarea id="backgroundMediaUrls" className="input-field media-textarea mono" rows={6} placeholder={'https://example.com/landscape.webp\nhttps://example.com/ocean.mp4'} value={state.draft.backgroundUrls} onChange={(e) => { state.update({ backgroundUrls: e.target.value }); state.clearError('backgroundMediaUrls'); }} aria-invalid={Boolean(inlineError)} aria-describedby={inlineError ? 'backgroundMediaUrls-error' : 'mediaHelp'} />
        {inlineError && <p className="field-error" id="backgroundMediaUrls-error" role="alert">{inlineError}</p>}
        <p className="help-text" id="mediaHelp">{s('mediaHelp')}</p>
      </div>
      {lines.length > 0 && <ul className="media-list">{lines.map(({ url, line }) => <li key={line}><span className="line-number">{line.toString().padStart(2, '0')}</span><span className="media-url">{url}</span><span className={`badge${!isHttpUrl(url) ? ' badge-error' : ''}`}>{isHttpUrl(url) ? s(detectMediaType(url)) : '!'}</span></li>)}</ul>}
      <p className="help-text privacy-note">{s('noPreview')}</p>
    </section>
  </>;
}

export function AnniversariesSection({ state }: Props) {
  const { anniversaries } = state.draft;
  const types = ['birthday', 'travel', 'anniversary', 'custom'] as const;
  const typeLabels = [t('anniversaryTypeBirthday'), t('anniversaryTypeTravel'), t('anniversaryTypeAnniversary'), t('anniversaryTypeCustom')];
  const patch = (index: number, value: Partial<(typeof anniversaries)[number]>) => state.update({ anniversaries: anniversaries.map((item, i) => i === index ? { ...item, ...value } : item) });
  const add = () => { const item = createAnniversaryItem({ title: '' }); state.update({ anniversaries: [...anniversaries, item] }); state.focusField(`date-name-${item.id}`); };
  return <section className="settings-section">
    <div className="section-heading"><h2>{s('dateCount', { count: anniversaries.length })}</h2><button className="secondary-button" type="button" onClick={add}>＋ {s('addDate')}</button></div>
    {!anniversaries.length && <div className="empty-state"><span className="empty-icon" aria-hidden="true">◇</span><h3>{s('emptyDates')}</h3><p>{s('emptyDatesHint')}</p></div>}
    <div className="anniversary-editor-list">{anniversaries.map((item, index) => {
      const nameId = `date-name-${item.id}`; const dateId = `date-value-${item.id}`;
      return <details className="anniversary-editor-card" key={item.id}>
        <summary className="item-summary"><span className="date-icon" aria-hidden="true">{item.date.slice(8) || '—'}</span><span className="item-copy"><strong>{item.title || s('newDate')}</strong><span className="item-meta">{item.date} · {item.calendar === 'lunar' ? t('anniversaryCalendarLunar') : t('anniversaryCalendarSolar')}{item.recurring && ` · ${t('anniversaryRecurring')}`}</span></span><span className="edit-label">{s('edit')} ⌄</span></summary>
        <div className="item-editor">
          <div className="field-stack"><label className="field-label" htmlFor={nameId}>{s('name')}</label><input className="input-field" id={nameId} value={item.title} maxLength={80} onChange={(e) => { patch(index, { title: e.target.value }); state.clearError(nameId); }} {...aria(state, nameId)} /><FieldError state={state} field={nameId} /></div>
          <div className="form-grid">
            <div className="field-stack"><label className="field-label" htmlFor={dateId}>{s('date')}</label><input className="input-field" id={dateId} type="date" value={item.date} onChange={(e) => { patch(index, { date: e.target.value }); state.clearError(dateId); }} {...aria(state, dateId)} /><FieldError state={state} field={dateId} /></div>
            <div className="field-stack"><label className="field-label" htmlFor={`date-type-${item.id}`}>{s('type')}</label><select id={`date-type-${item.id}`} className="input-field" value={item.type} onChange={(e) => patch(index, { type: e.target.value as AnniversaryType })}>{types.map((type, i) => <option value={type} key={type}>{typeLabels[i]}</option>)}</select></div>
            <div className="field-stack"><label className="field-label" htmlFor={`date-calendar-${item.id}`}>{s('calendar')}</label><select id={`date-calendar-${item.id}`} className="input-field" value={item.calendar} onChange={(e) => patch(index, { calendar: e.target.value as AnniversaryCalendar })}><option value="solar">{t('anniversaryCalendarSolar')}</option><option value="lunar">{t('anniversaryCalendarLunar')}</option></select></div>
          </div>
          {item.calendar === 'lunar' && <p className="help-text">{t('anniversaryCalendarHint')}</p>}
          <div className="field-stack"><label className="field-label" htmlFor={`date-note-${item.id}`}>{s('note')}</label><textarea id={`date-note-${item.id}`} className="input-field" value={item.note || ''} maxLength={160} rows={2} onChange={(e) => patch(index, { note: e.target.value })} /></div>
          <div className="settings-row"><label className="checkbox-label"><input type="checkbox" checked={item.recurring} onChange={(e) => patch(index, { recurring: e.target.checked })} />{t('anniversaryRecurringToggle')}</label><button className="danger-button" type="button" onClick={() => state.update({ anniversaries: anniversaries.filter((_, i) => i !== index) })}>{s('remove')}</button></div>
        </div>
      </details>;
    })}</div>
  </section>;
}
