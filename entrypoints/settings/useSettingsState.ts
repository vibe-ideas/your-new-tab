import { useEffect, useRef, useState } from 'react';
import { i18n, t, type Language } from '@/utils/i18n';
import { BOOKMARK_GROUP_IDS, readActiveBookmarkGroup, readBookmarkGroupConfig, readBookmarkGroupLabels, writeActiveBookmarkGroup, broadcastBookmarkRefresh, type BookmarkGroupId } from '@/utils/bookmarkGroups';
import { DEFAULT_SEARCH_PROVIDERS, DEFAULT_SEARCH_PROVIDER_ID, repairSearchProviderConfig, type SearchProvider } from '@/utils/searchProviders';
import { DEFAULT_ANNIVERSARIES, readAnniversaryItems, sanitizeAnniversaryItems, type AnniversaryItem } from '@/utils/anniversaries';
import { parseBookmarkJson } from '@/utils/bookmarks';
import { isHttpSearchTemplate, isHttpUrl } from '@/utils/safeUrl';
import { s } from './copy';

export type Section = 'search' | 'bookmarks' | 'backgrounds' | 'anniversaries';
export type BookmarkSource = 'default' | 'json' | 'remote';
export interface GroupDraft { source: BookmarkSource; label: string; json: string; url: string }
export interface SettingsDraft {
  groups: Record<BookmarkGroupId, GroupDraft>;
  providers: SearchProvider[];
  defaultProvider: string;
  backgroundUrls: string;
  anniversaries: AnniversaryItem[];
}
interface Issue { section: Section; field: string; message: string; group?: BookmarkGroupId }

function readProviders() {
  try {
    return repairSearchProviderConfig({
      providers: JSON.parse(localStorage.getItem('searchProviders') || 'null'),
      defaultProviderId: localStorage.getItem('defaultSearchProvider'),
      lastProviderId: localStorage.getItem('lastSearchProvider'),
    });
  } catch { return repairSearchProviderConfig({}); }
}

function readDraft(): SettingsDraft {
  const labels = readBookmarkGroupLabels();
  const group = (id: BookmarkGroupId): GroupDraft => {
    const config = readBookmarkGroupConfig(id);
    return { source: config.useDefaultBookmarks ? 'default' : config.useDirectJson ? 'json' : 'remote', label: labels[id], json: config.bookmarksJson, url: config.bookmarksUrl };
  };
  const providers = readProviders();
  return {
    groups: { external: group('external'), internal: group('internal') },
    providers: providers.providers, defaultProvider: providers.defaultProviderId,
    backgroundUrls: localStorage.getItem('customBackgroundMediaUrls') || '',
    anniversaries: readAnniversaryItems(),
  };
}

const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export const mediaLines = (value: string) => value.split('\n').map((url, index) => ({ url: url.trim(), line: index + 1 })).filter(({ url }) => url);

function validate(draft: SettingsDraft): Issue[] {
  const issues: Issue[] = [];
  draft.providers.forEach((provider) => {
    if (!provider.name.trim()) issues.push({ section: 'search', field: `provider-name-${provider.id}`, message: s('nameRequired') });
    const manual = provider.capability === 'manual' && isHttpUrl(provider.baseUrl);
    if (!manual && (!isHttpSearchTemplate(provider.urlTemplate) || !provider.urlTemplate?.includes('{query}'))) {
      issues.push({ section: 'search', field: `provider-url-${provider.id}`, message: s('templateInvalid') });
    }
  });
  for (const group of BOOKMARK_GROUP_IDS) {
    const config = draft.groups[group];
    if (config.source === 'json') {
      try { parseBookmarkJson(config.json); }
      catch (error) { issues.push({ section: 'bookmarks', group, field: 'bookmarksJson', message: (error as Error).message }); }
    } else if (config.source === 'remote' && !isHttpUrl(config.url)) {
      issues.push({ section: 'bookmarks', group, field: 'bookmarksUrl', message: s('urlInvalid') });
    }
  }
  const invalid = mediaLines(draft.backgroundUrls).filter(({ url }) => !isHttpUrl(url));
  if (invalid.length) issues.push({ section: 'backgrounds', field: 'backgroundMediaUrls', message: s('invalidMedia', { rows: invalid.map(({ line }) => line).join(', ') }) });
  draft.anniversaries.forEach((item) => {
    if (!item.title.trim()) issues.push({ section: 'anniversaries', field: `date-name-${item.id}`, message: s('nameRequired') });
    if (sanitizeAnniversaryItems([{ ...item, title: 'date' }]).length === 0) issues.push({ section: 'anniversaries', field: `date-value-${item.id}`, message: s('dateInvalid') });
  });
  return issues;
}

// Persist only changed sections using the existing storage contract. Keep errors
// observable to the UI; a best-effort rollback avoids partially applying a save.
function persist(draft: SettingsDraft, saved: SettingsDraft) {
  const writes = new Map<string, string | null>();
  for (const id of BOOKMARK_GROUP_IDS) {
    const next = draft.groups[id];
    const old = saved.groups[id];
    if (!equal({ ...next, label: '' }, { ...old, label: '' })) {
      const prefix = `bookmarkGroup.${id}.`;
      writes.set(prefix + 'useDefaultBookmarks', String(next.source === 'default'));
      writes.set(prefix + 'useDirectJson', String(next.source === 'json'));
      writes.set(prefix + 'bookmarksUrl', next.source === 'default' ? 'default' : next.source === 'remote' ? next.url : null);
      writes.set(prefix + 'bookmarksJson', next.source === 'json' ? next.json : null);
    }
  }
  if (BOOKMARK_GROUP_IDS.some((id) => draft.groups[id].label !== saved.groups[id].label)) {
    writes.set('bookmarkGroupLabels', JSON.stringify({ external: draft.groups.external.label.trim(), internal: draft.groups.internal.label.trim() }));
  }
  if (!equal(draft.providers, saved.providers) || draft.defaultProvider !== saved.defaultProvider) {
    const config = repairSearchProviderConfig({
      providers: draft.providers, defaultProviderId: draft.defaultProvider,
      lastProviderId: draft.defaultProvider !== saved.defaultProvider ? draft.defaultProvider : localStorage.getItem('lastSearchProvider'),
    });
    writes.set('searchProviders', JSON.stringify(config.providers));
    writes.set('defaultSearchProvider', config.defaultProviderId);
    writes.set('lastSearchProvider', config.lastProviderId);
  }
  if (draft.backgroundUrls !== saved.backgroundUrls) {
    writes.set('customBackgroundMediaUrls', mediaLines(draft.backgroundUrls).map(({ url }) => url).join('\n') || null);
    writes.set('customBackgroundMediaIndex', null);
  }
  if (!equal(draft.anniversaries, saved.anniversaries)) writes.set('anniversaryItems', JSON.stringify(draft.anniversaries));
  const previous = new Map([...writes.keys()].map((key) => [key, localStorage.getItem(key)]));
  try {
    for (const [key, value] of writes) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  } catch (error) {
    for (const [key, value] of previous) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch { /* The original error remains visible and the draft is retained. */ }
    }
    throw error;
  }
}

export function useSettingsState() {
  const [saved, setSaved] = useState(readDraft);
  const [draft, setDraft] = useState(saved);
  const [section, setSection] = useState<Section>('search');
  const [activeGroup, setGroup] = useState(readActiveBookmarkGroup);
  const [language, setLanguage] = useState(i18n.getLanguage());
  const [issues, setIssues] = useState<Issue[]>([]);
  const [focus, setFocus] = useState<{ field: string; token: number } | null>(null);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [testing, setTesting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const testRequest = useRef<AbortController | null>(null);
  const dirty = !equal(saved, draft);
  const group = draft.groups[activeGroup];

  const notify = (text: string, error = false) => {
    clearTimeout(timer.current);
    setStatus({ text, error });
    if (!error) timer.current = setTimeout(() => setStatus(null), 3000);
  };
  useEffect(() => () => { clearTimeout(timer.current); testRequest.current?.abort(); }, []);
  useEffect(() => {
    const config = readProviders();
    if (config.repaired) {
      try {
        localStorage.setItem('searchProviders', JSON.stringify(config.providers));
        localStorage.setItem('defaultSearchProvider', config.defaultProviderId);
        localStorage.setItem('lastSearchProvider', config.lastProviderId);
      } catch (error) { console.warn('Could not repair search settings', error); }
    }
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (!focus) return;
    const id = requestAnimationFrame(() => {
      const field = document.getElementById(focus.field);
      let parent = field?.parentElement;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(id);
  }, [focus, section, activeGroup]);

  const update = (patch: Partial<SettingsDraft>) => { setDraft((current) => ({ ...current, ...patch })); setStatus(null); };
  const updateGroup = (patch: Partial<GroupDraft>) => {
    testRequest.current?.abort();
    setTesting(false);
    setDraft((current) => ({ ...current, groups: { ...current.groups, [activeGroup]: { ...current.groups[activeGroup], ...patch } } }));
    setIssues((current) => current.filter((issue) => issue.group !== activeGroup));
    setStatus(null);
  };
  const selectGroup = (id: BookmarkGroupId) => {
    testRequest.current?.abort(); setTesting(false);
    setGroup(id); writeActiveBookmarkGroup(id);
  };
  const focusField = (field: string) => setFocus({ field, token: Date.now() });
  const clearError = (field: string) => setIssues((current) => current.filter((issue) => issue.field !== field));
  const failField = (field: string, message: string) => {
    setIssues([{ section, field, message, ...(section === 'bookmarks' ? { group: activeGroup } : {}) }]);
    notify(message, true); focusField(field);
  };
  const save = () => {
    const errors = validate(draft);
    setIssues(errors);
    if (errors.length) {
      const first = errors[0];
      setSection(first.section);
      if (first.group) selectGroup(first.group);
      focusField(first.field); notify(s('invalid'), true);
      return;
    }
    try {
      persist(draft, saved);
      setSaved(draft); notify(s('saved'));
    } catch (error) { console.warn('Could not save settings', error); notify(s('saveFailed'), true); }
  };
  const discard = () => { testRequest.current?.abort(); setTesting(false); setDraft(saved); setIssues([]); setStatus(null); };
  const restore = () => {
    if (section === 'search') update({ providers: structuredClone(DEFAULT_SEARCH_PROVIDERS), defaultProvider: DEFAULT_SEARCH_PROVIDER_ID });
    if (section === 'bookmarks') updateGroup({ source: 'default', label: '', json: '', url: '' });
    if (section === 'backgrounds') update({ backgroundUrls: '' });
    if (section === 'anniversaries') update({ anniversaries: structuredClone(DEFAULT_ANNIVERSARIES) });
    setIssues((current) => current.filter((issue) => issue.section !== section || (section === 'bookmarks' && issue.group !== activeGroup)));
    notify(s('restored'));
  };
  const changeLanguage = (value: Language) => { i18n.setLanguage(value); setLanguage(value); };
  const testBookmarks = async () => {
    testRequest.current?.abort();
    const controller = new AbortController();
    testRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), 10000);
    const field = group.source === 'json' ? 'bookmarksJson' : 'bookmarksUrl';
    setTesting(true);
    try {
      if (group.source === 'json') parseBookmarkJson(group.json);
      else {
        if (!isHttpUrl(group.url)) throw new Error(s('urlInvalid'));
        const response = await fetch(group.url, { signal: controller.signal });
        if (!response.ok) throw new Error(t('urlNotAccessible'));
        parseBookmarkJson(await response.text());
      }
      if (testRequest.current === controller && !controller.signal.aborted) { clearError(field); notify(s('valid')); }
    } catch (error) {
      if (testRequest.current === controller && !controller.signal.aborted) failField(field, (error as Error).message);
      else if (testRequest.current === controller && controller.signal.reason?.name === 'TimeoutError') failField(field, t('urlNotAccessible'));
    } finally { clearTimeout(timeout); if (testRequest.current === controller) setTesting(false); }
  };
  const formatJson = (compact = false) => {
    try { updateGroup({ json: JSON.stringify(JSON.parse(group.json), null, compact ? undefined : 2) }); }
    catch (error) { failField('bookmarksJson', (error as Error).message); }
  };
  const importJson = async (file: File) => {
    const targetGroup = activeGroup;
    try {
      const json = JSON.stringify(parseBookmarkJson(await file.text()), null, 2);
      setDraft((current) => ({ ...current, groups: { ...current.groups, [targetGroup]: { ...current.groups[targetGroup], source: 'json', json } } }));
      setIssues((current) => current.filter((issue) => issue.group !== targetGroup));
      notify(t('fileImported'));
    } catch (error) { selectGroup(targetGroup); failField('bookmarksJson', (error as Error).message); }
  };
  const exportJson = () => {
    try {
      const value = JSON.stringify(parseBookmarkJson(group.json), null, 2);
      const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'bookmarks.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) { failField('bookmarksJson', (error as Error).message); }
  };
  const errorFor = (field: string) => issues.find((issue) => issue.field === field && (!issue.group || issue.group === activeGroup))?.message;
  const refresh = () => { broadcastBookmarkRefresh(); notify(t('bookmarksRefreshed')); };
  return { draft, saved, dirty, section, setSection, activeGroup, selectGroup, group, language, changeLanguage, issues, errorFor, clearError, update, updateGroup, save, discard, restore, status, focusField, testing, testBookmarks, formatJson, importJson, exportJson, refresh };
}
export type SettingsState = ReturnType<typeof useSettingsState>;
