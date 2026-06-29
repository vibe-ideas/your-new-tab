import React from 'react';
import { t } from '@/utils/i18n';
import {
  ANNIVERSARIES_STORAGE_KEY,
  formatLunarDate,
  formatSolarDate,
  getAnniversaryCountdowns,
  readAnniversaryItems,
  type AnniversaryCountdown,
  type AnniversaryType,
} from '@/utils/anniversaries';

const TYPE_ICON: Record<AnniversaryType, string> = {
  birthday: '🎂',
  travel: '✈',
  anniversary: '◆',
  custom: '★',
};

function formatDays(item: AnniversaryCountdown) {
  if (item.isToday) return t('anniversaryToday');
  if (item.daysUntil === 1) return t('anniversaryTomorrow');
  return t('anniversaryDaysLeft', { days: item.daysUntil });
}

function formatPrimaryDate(item: AnniversaryCountdown) {
  if (item.calendar === 'lunar') return `${t('anniversaryCalendarLunarTag')} ${formatLunarDate(item.nextDate)}`;
  return `${t('anniversaryCalendarSolarTag')} ${formatSolarDate(item.nextDate)}`;
}

function formatSecondaryDate(item: AnniversaryCountdown) {
  if (item.calendar === 'lunar') return `${t('anniversaryCalendarSolarTag')} ${formatSolarDate(item.nextDate)}`;
  return item.recurring ? t('anniversaryRecurring') : t('anniversaryOneTime');
}

export function AnniversarySidebar() {
  const [items, setItems] = React.useState(() => readAnniversaryItems());

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ANNIVERSARIES_STORAGE_KEY) setItems(readAnniversaryItems());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const countdowns = React.useMemo(() => getAnniversaryCountdowns(items).slice(0, 6), [items]);
  if (countdowns.length === 0) return null;

  const pinned = countdowns.some((item) => item.isPinnedSoon);
  const hero = countdowns[0];

  return (
    <aside
      className={`anniversary-sidebar ${pinned ? 'is-pinned-soon' : ''}`}
      aria-label={t('anniversarySidebarLabel')}
      tabIndex={0}
    >
      <div className="anniversary-island-summary">
        <span className="anniversary-island-orb" aria-hidden="true" />
        <span className="anniversary-island-icon" aria-hidden="true">{TYPE_ICON[hero.type]}</span>
        <span className="anniversary-island-copy">
          <span className="anniversary-island-title">{hero.title}</span>
          <span className="anniversary-island-subtitle">{formatPrimaryDate(hero)}</span>
        </span>
        <span className="anniversary-island-days">{formatDays(hero)}</span>
      </div>

      <div className="anniversary-panel">
        <div className="anniversary-panel-header">
          <span>{t('anniversarySidebarTitle')}</span>
          {pinned && <strong>{t('anniversaryPinnedBadge')}</strong>}
        </div>
        <div className="anniversary-list">
          {countdowns.map((item) => (
            <div key={item.id} className={`anniversary-card type-${item.type}`}>
              <div className="anniversary-card-icon" aria-hidden="true">{TYPE_ICON[item.type]}</div>
              <div className="anniversary-card-copy">
                <div className="anniversary-card-title">{item.title}</div>
                <div className="anniversary-card-meta">
                  <span>{formatPrimaryDate(item)}</span>
                  <span>{formatSecondaryDate(item)}</span>
                </div>
                {item.note && <div className="anniversary-card-note">{item.note}</div>}
              </div>
              <div className="anniversary-card-days">{formatDays(item)}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
