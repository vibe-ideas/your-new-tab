import { t } from '@/utils/i18n';
import {
  createAnniversaryItem,
  type AnniversaryCalendar,
  type AnniversaryItem,
  type AnniversaryType,
} from '@/utils/anniversaries';

interface AnniversariesTabProps {
  anniversaries: AnniversaryItem[];
  setAnniversaries: (items: AnniversaryItem[]) => void;
}

const TYPES: { value: AnniversaryType; labelKey: 'anniversaryTypeBirthday' | 'anniversaryTypeTravel' | 'anniversaryTypeAnniversary' | 'anniversaryTypeCustom' }[] = [
  { value: 'birthday', labelKey: 'anniversaryTypeBirthday' },
  { value: 'travel', labelKey: 'anniversaryTypeTravel' },
  { value: 'anniversary', labelKey: 'anniversaryTypeAnniversary' },
  { value: 'custom', labelKey: 'anniversaryTypeCustom' },
];
const CALENDARS: { value: AnniversaryCalendar; labelKey: 'anniversaryCalendarSolar' | 'anniversaryCalendarLunar' }[] = [
  { value: 'solar', labelKey: 'anniversaryCalendarSolar' },
  { value: 'lunar', labelKey: 'anniversaryCalendarLunar' },
];

export default function AnniversariesTab(props: AnniversariesTabProps) {
  const { anniversaries, setAnniversaries } = props;

  const updateItem = (index: number, patch: Partial<AnniversaryItem>) => {
    const next = [...anniversaries];
    next[index] = { ...next[index], ...patch };
    setAnniversaries(next);
  };

  return (
    <div role="tabpanel" data-tab-panel="anniversaries">
      <section className="config-panel">
        <div className="section-heading">
          <div>
            <h2>{t('anniversarySection')}</h2>
            <p>{t('anniversarySectionHint')}</p>
          </div>
          <span className="section-badge">{anniversaries.length}</span>
        </div>

        <div className="anniversary-editor-list">
          {anniversaries.map((item, index) => (
            <div key={item.id} className="anniversary-editor-card">
              <div className="anniversary-editor-grid">
                <input
                  className="input-field"
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder={t('anniversaryTitlePlaceholder')}
                />
                <input
                  className="input-field"
                  type="date"
                  value={item.date}
                  onChange={(e) => updateItem(index, { date: e.target.value })}
                />
                <select
                  className="input-field select-field"
                  value={item.type}
                  onChange={(e) => updateItem(index, { type: e.target.value as AnniversaryType })}
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{t(type.labelKey)}</option>
                  ))}
                </select>
                <select
                  className="input-field select-field"
                  value={item.calendar}
                  onChange={(e) => updateItem(index, { calendar: e.target.value as AnniversaryCalendar })}
                >
                  {CALENDARS.map((calendar) => (
                    <option key={calendar.value} value={calendar.value}>{t(calendar.labelKey)}</option>
                  ))}
                </select>
              </div>
              <textarea
                className="input-field textarea-field anniversary-note-field"
                value={item.note || ''}
                onChange={(e) => updateItem(index, { note: e.target.value })}
                placeholder={t('anniversaryNotePlaceholder')}
                rows={2}
              />
              <div className="anniversary-editor-actions">
                <label className="provider-toggle">
                  <input
                    type="checkbox"
                    checked={item.recurring}
                    onChange={(e) => updateItem(index, { recurring: e.target.checked })}
                  />
                  <span>{t('anniversaryRecurringToggle')}</span>
                </label>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setAnniversaries(anniversaries.filter((_, i) => i !== index))}
                >
                  {t('removeProvider')}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="inline-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setAnniversaries([...anniversaries, createAnniversaryItem({ title: t('anniversaryNewItem') })])}
          >
            {t('anniversaryAdd')}
          </button>
        </div>
        <div className="config-info subtle-info">{t('anniversaryCalendarHint')}</div>
      </section>
    </div>
  );
}
