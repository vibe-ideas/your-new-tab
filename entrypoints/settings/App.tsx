import { useEffect, useRef, useState } from 'react';
import { s, type CopyKey } from './copy';
import { useSettingsState, type Section } from './useSettingsState';
import { SearchSection, BookmarksSection, BackgroundsSection, AnniversariesSection } from './sections';
import './settings.css';

const sections: { id: Section; intro: CopyKey; path: string }[] = [
  { id: 'search', intro: 'searchIntro', path: 'm21 21-4.4-4.4M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z' },
  { id: 'bookmarks', intro: 'bookmarksIntro', path: 'M6 3h12v18l-6-4-6 4V3Z' },
  { id: 'backgrounds', intro: 'backgroundsIntro', path: 'M3 3h18v18H3V3Zm0 14 5-5 4 4 3-3 6 6M8 8h.01' },
  { id: 'anniversaries', intro: 'anniversariesIntro', path: 'M4 5h16v16H4V5ZM8 3v4m8-4v4M4 10h16M8 14h2m4 0h2m-8 3h2' },
];
function Icon({ path }: { path: string }) { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>; }

export default function App() {
  const state = useSettingsState();
  const active = sections.find((item) => item.id === state.section)!;
  const dialog = useRef<HTMLDialogElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { document.title = `${s('settings')} · Your New Tab`; document.documentElement.lang = state.language; }, [state.language]);
  useEffect(() => { if (confirming) dialog.current?.showModal(); else dialog.current?.close(); }, [confirming]);
  const closeDialog = () => { setConfirming(false); resetButton.current?.focus(); };
  const restoreName = state.section === 'bookmarks' ? state.group.label.trim() || s(state.activeGroup) : s(state.section);
  return <div className="settings-shell">
    <header className="settings-header">
      <div className="brand-lockup"><span className="brand-mark"><Icon path="M4 5h16v14H4V5Zm4 4h8m-8 4h5" /></span><div><div className="brand-title">Your New Tab <span>/ {s('settings')}</span></div><p className="brand-subtitle">{s('subtitle')}</p></div></div>
      <div className="language-switcher" role="group" aria-label="Language / 语言">{(['zh-CN', 'en'] as const).map((language) => <button key={language} type="button" className={`language-button${state.language === language ? ' active' : ''}`} aria-pressed={state.language === language} onClick={() => state.changeLanguage(language)}>{language === 'en' ? 'EN' : '中文'}</button>)}</div>
    </header>
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <nav className="settings-nav" role="tablist" aria-label={s('settings')}>
          {sections.map((item, index) => <button id={`nav-${item.id}`} className={`nav-item${state.section === item.id ? ' active' : ''}`} type="button" role="tab" data-tab={item.id} key={item.id} aria-selected={state.section === item.id} aria-controls="settings-panel" tabIndex={state.section === item.id ? 0 : -1} onClick={() => state.setSection(item.id)} onKeyDown={(event) => {
            let next: number;
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % sections.length;
            else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + sections.length - 1) % sections.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = sections.length - 1;
            else return;
            event.preventDefault(); state.setSection(sections[next].id); document.getElementById(`nav-${sections[next].id}`)?.focus();
          }}><span className="nav-icon"><Icon path={item.path} /></span>{s(item.id)}</button>)}
        </nav>
        <div className="sidebar-note"><Icon path="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6" /><strong>{s('local')}</strong><p>{s('localHint')}</p></div>
      </aside>
      <main className="settings-main">
        <div id="settings-panel" role="tabpanel" aria-labelledby={`nav-${state.section}`} tabIndex={0} data-tab-panel={state.section}>
          <header className="section-header"><span className="eyebrow">YOUR NEW TAB</span><h1>{s(state.section)}</h1><p>{s(active.intro)}</p></header>
          <div className="section-body">
            {state.section === 'search' && <SearchSection state={state} />}
            {state.section === 'bookmarks' && <BookmarksSection state={state} />}
            {state.section === 'backgrounds' && <BackgroundsSection state={state} />}
            {state.section === 'anniversaries' && <AnniversariesSection state={state} />}
            <div className="section-reset settings-row"><div className="row-copy"><p className="help-text">{s(state.section === 'bookmarks' ? 'restoreGroupHint' : 'restoreHint')}</p></div><button ref={resetButton} className="text-button reset-button" type="button" onClick={() => setConfirming(true)}>{s(state.section === 'bookmarks' ? 'restoreGroup' : 'restore')}</button></div>
          </div>
        </div>
        <footer className="save-bar">
          <div className="save-status" data-dirty={state.dirty} role="status"><strong><span className="status-dot" />{s(state.dirty ? 'dirty' : 'clean')}</strong><span>{s('saveHint')}</span></div>
          <div className="save-actions"><button id="discardConfigButton" type="button" className="ghost-button" disabled={!state.dirty} onClick={state.discard}>{s('discard')}</button><button id="saveConfigButton" type="button" className="primary-button" disabled={!state.dirty} onClick={state.save}>{s('save')}</button></div>
        </footer>
      </main>
    </div>
    {state.status && <div className={`status-message ${state.status.error ? 'error' : 'success'}`} role={state.status.error ? 'alert' : 'status'} aria-live={state.status.error ? 'assertive' : 'polite'}>{state.status.text}</div>}
    <dialog ref={dialog} className="confirm-dialog" aria-labelledby="restore-title" aria-describedby="restore-description" onCancel={closeDialog} onClose={() => setConfirming(false)}>
      <div className="dialog-body"><h2 id="restore-title">{s('confirmTitle')}</h2><p id="restore-description">{s('confirmBody', { name: restoreName })}</p></div>
      <div className="dialog-actions"><button type="button" className="secondary-button" autoFocus onClick={closeDialog}>{s('cancel')}</button><button id="confirmRestoreButton" type="button" className="primary-button" onClick={() => { state.restore(); closeDialog(); }}>{s('confirm')}</button></div>
    </dialog>
  </div>;
}
