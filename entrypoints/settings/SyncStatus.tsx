import { useEffect, useState } from 'react';
import { downloadSyncBackup, getSyncStatus, retryConfigSync, SYNC_STATUS_EVENT } from '@/utils/configSyncClient';
import { s } from './copy';
import { SYNC_LIMIT } from '@/utils/configSyncModel';
import { i18n } from '@/utils/i18n';

function SyncTime({ timestamp }: { timestamp?: number }) {
  if (!timestamp) return <span>{s('syncNoTime')}</span>;
  const date = new Date(timestamp);
  const text = new Intl.DateTimeFormat(i18n.getLanguage(), {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
  return <time dateTime={date.toISOString()} title={date.toString()}>{text}</time>;
}

export function SyncStatus() {
  const [status, setStatus] = useState(getSyncStatus);
  const [backupError, setBackupError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    const update = () => setStatus(getSyncStatus());
    window.addEventListener(SYNC_STATUS_EVENT, update);
    return () => window.removeEventListener(SYNC_STATUS_EVENT, update);
  }, []);
  const error = status.error?.includes('SYNC_QUOTA') || status.error?.includes('QUOTA_BYTES') ? 'syncQuota' : status.error?.includes('SYNC_INCOMPLETE') ? 'syncIncomplete' : 'syncError';
  return <div className="config-sync" data-sync-status={status.status}>
    <h2>{s('syncTitle')}</h2>
    <p role="status" aria-live="polite">{s(retrying ? 'syncChecking' : status.status === 'ready' ? 'syncReady' : status.status === 'pending' ? 'syncPending' : error)}</p>
    <div className="sync-capacity"><div><span>{s('syncCapacity')}</span><span>{(status.bytes / 1024).toFixed(1)} / {SYNC_LIMIT / 1024} KiB</span></div><meter min={0} max={SYNC_LIMIT} value={status.bytes} aria-label={s('syncUsage', { size: (status.bytes / 1024).toFixed(1) })} /></div>
    <dl className="sync-times">
      <div data-sync-time="written"><dt>{s('syncLastWritten')}</dt><dd><SyncTime timestamp={status.lastWrittenAt} /></dd></div>
    </dl>
    <p className="sync-transport">{s('syncTransport')}</p>
    <details className="sync-details"><summary>{s('syncDetails')}<span aria-hidden="true">⌄</span></summary>
    <dl className="sync-times">
      <div data-sync-time="received"><dt>{s('syncLastReceived')}</dt><dd><SyncTime timestamp={status.lastReceivedAt} /></dd></div>
      <div data-sync-time="checked"><dt>{s('syncLastChecked')}</dt><dd><SyncTime timestamp={status.lastCheckedAt} /></dd></div>
    </dl>
    <p>{s('syncHint')}</p>
    <button type="button" className="text-button" onClick={() => { void downloadSyncBackup().catch(() => setBackupError(true)); }}>{s('syncBackup')}</button>
    {backupError && <p role="alert">{s('syncBackupError')}</p>}
    </details>
    <button type="button" className="secondary-button sync-retry" disabled={retrying || status.status === 'pending'} onClick={async () => {
      setRetrying(true);
      try { await retryConfigSync(); } finally { setRetrying(false); }
    }}>{s(retrying ? 'syncChecking' : 'syncRetry')}</button>
  </div>;
}
