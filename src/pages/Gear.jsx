import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Empty, Loader } from '../components/ui';
import { normalize } from '../lib/geo';
import { GEAR_TAGS, GEAR_TRIPS, GEAR_TAG, GEAR_TRIP } from '../data/gear';

/* ------------------------------------------------------------------ */
/* Đồ dùng du lịch (#/gear): lọc theo hình thức đi, công năng, tìm kiếm */
/* Link mua hàng là link tiếp thị liên kết (affiliate) — ghi rõ        */
/* ------------------------------------------------------------------ */

export default function GearPage() {
  const { t, lang } = useI18n();
  const { adminApi, can } = useApp();
  const [items, setItems] = useState(null);
  const [trip, setTrip] = useState('');
  const [tags, setTags] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => adminApi.watchGear(setItems), [adminApi]);
  const L = (x) => (x ? x[lang] || x.vi || x.en || '' : '');
  const list = useMemo(() => {
    const n = normalize(q);
    return (items || [])
      .filter((x) => x.active !== false)
      .filter((x) => !trip || (x.trips || []).includes(trip))
      .filter((x) => !tags.length || tags.every((tg) => (x.tags || []).includes(tg)))
      .filter((x) => !n || normalize(`${x.name?.vi} ${x.name?.en} ${x.desc?.vi} ${x.desc?.en}`).includes(n))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt || 0) - (b.createdAt || 0));
  }, [items, trip, tags, q]);
  if (!can('gear')) return null;
  const toggleTag = (k) => setTags((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]));
  return (
    <div className="page gear">
      <header className="guide__head">
        <p className="eyebrow">🎒 {t('gear.eyebrow')}</p>
        <h1 className="h1">{t('gear.title')}</h1>
        <p className="muted">{t('gear.lead')}</p>
      </header>
      <p className="gear-disclosure">
        🔗 <b>{t('gear.affTitle')}</b> {t('gear.affText')}
      </p>
      <div className="gear-filters card">
        <input className="gear-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`🔎 ${t('gear.search')}`} />
        <div>
          <small className="muted">{t('gear.byTrip')}</small>
          <div className="chips chips--wrap">
            <button type="button" className={`chip ${!trip ? 'chip--on' : ''}`} onClick={() => setTrip('')}>
              {t('common.all')}
            </button>
            {GEAR_TRIPS.map((x) => (
              <button key={x.key} type="button" className={`chip ${trip === x.key ? 'chip--on' : ''}`} onClick={() => setTrip(trip === x.key ? '' : x.key)}>
                {x.icon} {x[lang] || x.vi}
              </button>
            ))}
          </div>
        </div>
        <div>
          <small className="muted">{t('gear.byTag')}</small>
          <div className="chips chips--wrap">
            {GEAR_TAGS.map((x) => (
              <button key={x.key} type="button" className={`chip gear-tag ${tags.includes(x.key) ? 'chip--on' : ''}`} onClick={() => toggleTag(x.key)}>
                {x.icon} {x[lang] || x.vi}
              </button>
            ))}
            {(tags.length > 0 || trip || q) && (
              <button type="button" className="chip" onClick={() => (setTags([]), setTrip(''), setQ(''))}>
                ✕ {t('gear.clear')}
              </button>
            )}
          </div>
        </div>
      </div>
      {!items ? (
        <Loader />
      ) : !list.length ? (
        <Empty emoji="🎒" title={t('gear.empty')} text={items.length ? t('gear.emptyFilter') : t('gear.emptyAll')} />
      ) : (
        <>
          <p className="small muted">{t('gear.count', { n: list.length })}</p>
          <div className="gear-grid">
            {list.map((x) => (
              <article key={x.id} className="gear-card card">
                <div className="gear-card__img">{x.image ? <img src={x.image} alt={L(x.name)} loading="lazy" referrerPolicy="no-referrer" /> : <span aria-hidden>{x.icon || '🎒'}</span>}</div>
                <div className="gear-card__body">
                  <h3>{L(x.name)}</h3>
                  {L(x.desc) && <p className="small muted">{L(x.desc)}</p>}
                  <div className="gear-card__tags">
                    {(x.tags || []).map((k) => GEAR_TAG[k] && <span key={k}>{GEAR_TAG[k].icon} {GEAR_TAG[k][lang] || GEAR_TAG[k].vi}</span>)}
                  </div>
                  <small className="muted gear-card__trips">{(x.trips || []).map((k) => GEAR_TRIP[k]?.icon).join(' ')}</small>
                </div>
                <div className="gear-card__foot">
                  {x.price && <b>{x.price}</b>}
                  {x.url ? (
                    <a className="btn btn--sm btn--primary" href={x.url} target="_blank" rel="sponsored noopener noreferrer">
                      🛒 {t('gear.buy')} ↗
                    </a>
                  ) : (
                    <span className="small muted">{t('gear.noLink')}</span>
                  )}
                </div>
                {x.url && <span className="gear-aff">{t('gear.affBadge')}</span>}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
