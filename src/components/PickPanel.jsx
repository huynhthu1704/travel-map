import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { countryName, flagOf } from '../lib/countries';
import { formatDate } from './ui';

/** Bảng nổi khi đang thêm nhiều địa điểm bằng cách chạm lên bản đồ */
export default function PickPanel() {
  const { pickStatus, setPickStatus, pickDate, setPickDate, picked, removePicked, renamePicked, finishPicking, setFlyTarget } = useApp();
  const { t } = useI18n();
  return (
    <aside className="panel pick-panel">
      <div className="panel__scroll stack">
        <div className="pick-panel__head">
          <div>
            <h2 className="h3">{t('pick.title')}</h2>
            <p className="small muted">{t('pick.hint')}</p>
          </div>
          <button className="btn btn--dark btn--sm" onClick={finishPicking}>
            {t('pick.finish', { n: picked.length })}
          </button>
        </div>
        <div className="segmented" role="radiogroup" aria-label={t('pick.saveAs')}>
          <button className={pickStatus === 'visited' ? 'on' : ''} onClick={() => setPickStatus('visited')} aria-pressed={pickStatus === 'visited'}>
            👣 {t('legend.visited')}
          </button>
          <button className={pickStatus === 'wishlist' ? 'on' : ''} onClick={() => setPickStatus('wishlist')} aria-pressed={pickStatus === 'wishlist'}>
            💛 {t('legend.wish')}
          </button>
        </div>
        {pickStatus === 'visited' && (
          <label className="field">
            <span>{t('pick.date')}</span>
            <input type="date" value={pickDate} onChange={(e) => setPickDate(e.target.value)} />
          </label>
        )}
        {picked.length === 0 ? (
          <div className="pick-panel__empty">
            <span>👆</span>
            <p className="small muted">{t('pick.empty')}</p>
          </div>
        ) : (
          <ol className="pick-list">
            {picked.map(({ place, status, date, loading }) => (
              <li key={place.id} className={loading ? 'is-loading' : ''}>
                <button className="pick-list__icon" onClick={() => setFlyTarget({ lat: place.lat, lng: place.lng, zoom: 14, t: Date.now() })} aria-label={t('common.viewOnMap')}>
                  {status === 'visited' ? '👣' : '💛'}
                </button>
                <div className="pick-list__main">
                  <input
                    defaultValue={place.name}
                    key={place.name}
                    disabled={loading}
                    aria-label={t('place.rename')}
                    onBlur={(e) => e.target.value.trim() && e.target.value !== place.name && renamePicked(place, e.target.value.trim(), status, date)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  />
                  <small>
                    {flagOf(place.country)} {[place.city, countryName(place.country)].filter(Boolean).join(', ')}
                    {date ? ` · 📅 ${formatDate(date)}` : ''}
                  </small>
                </div>
                <button className="icon-btn" onClick={() => removePicked(place)} aria-label={t('pick.undo')} disabled={loading}>
                  ✕
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}
