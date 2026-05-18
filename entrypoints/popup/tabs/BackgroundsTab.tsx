import { t } from '@/utils/i18n';

interface BackgroundsTabProps {
  backgroundMediaUrlsInput: string;
  setBackgroundMediaUrlsInput: (v: string) => void;
}

export default function BackgroundsTab(props: BackgroundsTabProps) {
  const { backgroundMediaUrlsInput, setBackgroundMediaUrlsInput } = props;

  return (
    <div role="tabpanel" data-tab-panel="backgrounds">
      <section className="config-panel">
        <div className="section-heading">
          <div>
            <h2>{t('backgroundSection')}</h2>
            <p>{t('backgroundSectionHint')}</p>
          </div>
        </div>

        <div className="field-stack">
          <label htmlFor="backgroundMediaUrls" className="field-label">
            {t('backgroundMediaUrls')}
          </label>
          <textarea
            id="backgroundMediaUrls"
            value={backgroundMediaUrlsInput}
            onChange={(e) => setBackgroundMediaUrlsInput(e.target.value)}
            placeholder={t('backgroundMediaPlaceholder')}
            className="input-field textarea-field"
            rows={5}
          />
          <div className="config-info">{t('backgroundMediaTip')}</div>
        </div>
      </section>
    </div>
  );
}
