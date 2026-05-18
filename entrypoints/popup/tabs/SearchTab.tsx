import { t } from '@/utils/i18n';
import {
  DEFAULT_SEARCH_PROVIDER_ID,
  isBuiltInSearchProvider,
  type SearchProvider,
} from '@/utils/searchProviders';

interface SearchTabProps {
  providers: SearchProvider[];
  setProviders: (v: SearchProvider[]) => void;
  defaultSearchProvider: string;
  setDefaultSearchProvider: (v: string) => void;
  handleSaveProviders: () => void;
}

export default function SearchTab(props: SearchTabProps) {
  const {
    providers, setProviders,
    defaultSearchProvider, setDefaultSearchProvider,
    handleSaveProviders,
  } = props;

  return (
    <div role="tabpanel" data-tab-panel="search">
      <section className="config-panel">
        <div className="section-heading">
          <div>
            <h2>{t('searchSection')}</h2>
            <p>{t('searchSectionHint')}</p>
          </div>
        </div>

        <div className="default-provider-row">
          <select
            id="defaultSearchProvider"
            value={defaultSearchProvider}
            onChange={(e) => setDefaultSearchProvider(e.target.value)}
            className="input-field select-field"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={handleSaveProviders} className="secondary-button" type="button">
            {t('save')}
          </button>
        </div>

        <div className="provider-list">
          {providers.map((p, idx) => (
            <div key={p.id} className="provider-card" data-provider-id={p.id}>
              <div className="provider-card-header">
                <label className="provider-toggle">
                  <input
                    type="checkbox"
                    checked={p.enabled !== false}
                    disabled={isBuiltInSearchProvider(p.id)}
                    onChange={(e) => {
                      const next = [...providers];
                      next[idx] = { ...p, enabled: e.target.checked };
                      setProviders(next);
                    }}
                  />
                  <span>{p.enabled !== false ? t('enabledLabel') : t('disabledLabel')}</span>
                </label>
                {p.requiresLogin && (
                  <span className="provider-login-badge" title={t('requiresLoginLabel')}>
                    🔐 {t('requiresLoginLabel')}
                  </span>
                )}
                {!isBuiltInSearchProvider(p.id) && (
                  <button
                    onClick={() => setProviders(providers.filter((pp) => pp.id !== p.id))}
                    className="ghost-button"
                    type="button"
                  >
                    {t('removeProvider')}
                  </button>
                )}
              </div>
              <div className="provider-fields">
                <input
                  className="input-field"
                  value={p.name}
                  onChange={(e) => {
                    const next = [...providers];
                    next[idx] = { ...p, name: e.target.value };
                    setProviders(next);
                  }}
                  placeholder={t('searchProviderName')}
                />
                <input
                  className="input-field"
                  value={p.urlTemplate || ''}
                  onChange={(e) => {
                    const next = [...providers];
                    next[idx] = { ...p, urlTemplate: e.target.value };
                    setProviders(next);
                  }}
                  placeholder={t('searchProviderUrl')}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="inline-actions">
          <button
            onClick={() => {
              const id = `custom_${Date.now()}`;
              const next = [...providers, {
                id, name: 'Custom', urlTemplate: '',
                capability: 'experimental' as const, enabled: true,
              }];
              setProviders(next);
              if (!defaultSearchProvider) setDefaultSearchProvider(DEFAULT_SEARCH_PROVIDER_ID);
            }}
            className="secondary-button"
            type="button"
          >
            {t('addProvider')}
          </button>
        </div>
      </section>
    </div>
  );
}
