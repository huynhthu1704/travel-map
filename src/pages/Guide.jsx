import { Fragment, useState } from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../AppContext';
import { countryName, flagOf } from '../lib/countries';
import { hrefCountry } from '../lib/route';
import { AppLink, Modal } from '../components/ui';
import { GUIDE_SPOTS } from '../data/guideSpots';
import { searchNominatim } from '../lib/geo';
import AdSlot from '../components/AdSlot';
import { GUIDES, GUIDE_BY_CC, SECTIONS, GUIDES_CHECKED } from '../data/guides';

/** Hiển thị **đậm**, *nghiêng* và [link](url) trong nội dung cẩm nang */
function Rich({ text }) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<b key={m.index}>{m[1]}</b>);
    else if (m[2]) parts.push(<em key={m.index}>{m[2]}</em>);
    else parts.push(
      <a key={m.index} href={m[4]} target="_blank" rel="noopener noreferrer">
        {m[3]}
      </a>,
    );
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => (typeof p === 'string' ? <Fragment key={i}>{p}</Fragment> : p))}</>;
}

/** Tách đoạn dài thành các ý ngắn để dễ đọc: theo câu, theo dấu "·", và theo từng địa điểm "A (…), B (…)" */
function toPoints(key, text) {
  if (!text) return [];
  let parts;
  if (text.includes(' · ')) parts = text.split(' · ');
  else if (key === 'places') parts = text.split(/(?<=\)),\s+/);
  else parts = text.split(/(?<=[.;!?])\s+(?=[\p{Lu}*[(])/u);
  return parts.map((x) => x.trim().replace(/;$/, '')).filter(Boolean);
}

/** #/guide và #/guide/<cc> — Cẩm nang du lịch châu Á */
export default function GuidePage() {
  const { guideCc, setGuideCc } = useApp();
  const g = guideCc && GUIDE_BY_CC[guideCc];
  return g ? <CountryGuide g={g} onBack={() => setGuideCc(null)} /> : <GuideList onOpen={(cc) => (window.scrollTo?.(0, 0), setGuideCc(cc))} />;
}

function GuideList({ onOpen }) {
  const { t, lang } = useI18n();
  return (
    <div className="page guide">
      <header className="guide__head">
        <p className="eyebrow">📖 {t('guide.eyebrow')}</p>
        <h1 className="h1">{t('guide.title')}</h1>
        <p className="muted">{t('guide.lead')}</p>
      </header>
      <div className="guide-grid">
        {GUIDES.map((g) => (
          <a key={g.cc} href={`#/guide/${g.cc}`} className="guide-card card" onClick={(e) => (e.preventDefault(), onOpen(g.cc))}>
            <span className="guide-card__flag">{flagOf(g.cc)}</span>
            <span className="guide-card__main">
              <b>{countryName(g.cc)}</b>
              <span className="guide-card__tag">{g.visaTag[lang] || g.visaTag.vi}</span>
              <small>{g.lead[lang] || g.lead.vi}</small>
            </span>
          </a>
        ))}
      </div>
      <p className="tiny muted guide__note">{t('guide.checked', { date: GUIDES_CHECKED })}</p>
      <AdSlot placement="guide-bottom" size="banner" />
    </div>
  );
}

function CountryGuide({ g, onBack }) {
  const { t, lang } = useI18n();
  const { openCountry, openTips, can } = useApp();
  const L = (x) => (x ? x[lang] || x.vi : '');
  return (
    <div className="page guide">
      <a href="#/guide" className="back" onClick={(e) => (e.preventDefault(), onBack())}>
        ← {t('guide.all')}
      </a>
      <header className="guide-hero card">
        <span className="guide-hero__flag">{flagOf(g.cc)}</span>
        <div className="guide-hero__main">
          <h1 className="h1">{countryName(g.cc)}</h1>
          <span className="guide-card__tag">{L(g.visaTag)}</span>
          <p>{L(g.lead)}</p>
          <div className="row wrap">
            <AppLink className="btn btn--sm btn--soft" href={hrefCountry(g.cc)} onClick={() => openCountry(g.cc)}>
              🗺️ {t('guide.onMap')}
            </AppLink>
            {can('tips') && (
              <a className="btn btn--sm btn--primary" href={`#/tips/${g.cc}`} onClick={(e) => (e.preventDefault(), openTips(g.cc))}>
                🧭 {t('guide.tips')}
              </a>
            )}
          </div>
        </div>
      </header>
      <nav className="guide-toc chips chips--scroll">
        {SECTIONS.map((s) => (
          <a key={s.key} className="chip" href={`#g-${s.key}`} onClick={(e) => (e.preventDefault(), document.getElementById(`g-${s.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}>
            {s.icon} {s[lang] || s.vi}
          </a>
        ))}
      </nav>
      <div className="guide-sections">
        {SECTIONS.map((s, i) => (
          <Fragment key={s.key}>
            <section id={`g-${s.key}`} className="guide-sec card">
              <h2 className="h3">
                <span>{s.icon}</span> {s[lang] || s.vi}
              </h2>
              {(() => {
                const pts = toPoints(s.key, L(g[s.key]));
                return pts.length > 1 ? (
                  <ul className="guide-points">
                    {pts.map((x, k) => (
                      <li key={k}>
                        <Rich text={x} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    <Rich text={pts[0] || ''} />
                  </p>
                );
              })()}
              {s.key === 'places' && can('guideToTrip') && GUIDE_SPOTS[g.cc] && <GuideSpots cc={g.cc} />}
            </section>
          </Fragment>
        ))}
      </div>
      <p className="tiny muted guide__note">{t('guide.checked', { date: GUIDES_CHECKED })}</p>
      <AdSlot placement={`guide-${g.cc}`} size="banner" />
    </div>
  );
}

/** Các địa điểm trong "Nơi nên đi" — bấm để thêm vào kế hoạch một chuyến đi của mình */
function GuideSpots({ cc }) {
  const { t, lang } = useI18n();
  const { requireLogin } = useApp();
  const [spot, setSpot] = useState(null);
  return (
    <div className="guide-spots">
      <p className="small muted">➕ {t('guide.addHint')}</p>
      <div className="chips">
        {GUIDE_SPOTS[cc].map((x) => (
          <button key={x.n} type="button" className="chip guide-spot" onClick={() => requireLogin(() => setSpot(x), t('guide.addLogin'))}>
            {(lang === 'vi' && x.vi) || x.n} <b>+</b>
          </button>
        ))}
      </div>
      {spot && <AddSpotModal cc={cc} spot={spot} onClose={() => setSpot(null)} />}
    </div>
  );
}

function AddSpotModal({ cc, spot, onClose }) {
  const { t, lang } = useI18n();
  const { user, trips, api, notify, setView, setOpenTripId } = useApp();
  const [busy, setBusy] = useState('');
  const label = (lang === 'vi' && spot.vi) || spot.n;
  const mine = (trips || []).filter((tr) => !tr.memberIds || tr.memberIds.includes(user?.uid));
  const add = async (tr) => {
    setBusy(tr.id);
    try {
      const [hit] = await searchNominatim(spot.q, undefined, lang, { countrycodes: cc, limit: 1 });
      if (!hit) throw new Error('nf');
      const place = { ...hit, id: `guide-${cc}-${spot.n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name: label, country: cc };
      const plan = await new Promise((res) => {
        let off = null;
        off = api.watchPlan(tr.id, (items) => {
          res(items || []);
          setTimeout(() => off && off(), 0);
        });
      });
      if (plan.some((it) => it.place?.id === place.id || (it.place?.name === label && it.place?.country === cc))) {
        notify(t('guide.already', { name: label, trip: tr.name }));
      } else {
        await api.addPlanItem(user, tr.id, { place, order: Date.now() });
        notify(t('guide.added', { name: label, trip: tr.name }));
      }
      onClose();
    } catch (e) {
      notify(e?.message === 'nf' ? t('guide.notFound') : t('admin.error', { msg: e?.message || '' }), 'error');
      setBusy('');
    }
  };
  return (
    <Modal onClose={onClose} title={t('guide.addTitle', { name: label })}>
      {mine.length ? (
        <div className="stack">
          <p className="small muted">{t('guide.pickTrip')}</p>
          {mine.map((tr) => (
            <button key={tr.id} type="button" className="btn btn--soft guide-trip" disabled={!!busy} onClick={() => add(tr)}>
              <span>{tr.emoji || '🧳'}</span> <b>{tr.name}</b>
              {busy === tr.id && <span className="muted"> …</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="stack">
          <p>{t('guide.noTrips')}</p>
          <button type="button" className="btn btn--primary" onClick={() => (onClose(), setOpenTripId(null), setView('trips'))}>
            🧳 {t('guide.createTrip')}
          </button>
        </div>
      )}
    </Modal>
  );
}
