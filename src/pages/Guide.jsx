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
import { GUIDE_PHRASES } from '../data/guidePhrases';
import { GUIDE_FOODS } from '../data/guideFoods';
import { GUIDE_EMERGENCY, VN_CITIZEN_HOTLINE } from '../data/guideEmergency';
import { useWikiThumb } from '../lib/placeImage';
import { useI18n as useI18nSpeak } from '../i18n';

/** Đọc to bằng giọng bản địa (Web Speech API của trình duyệt) */
function speakText(text, lang) {
  const synth = typeof window !== 'undefined' && window.speechSynthesis;
  if (!synth) return 'unsupported';
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const base = lang.split('-')[0];
  const voices = synth.getVoices();
  const v = voices.find((x) => x.lang === lang || x.lang.replace('_', '-') === lang) || voices.find((x) => x.lang.toLowerCase().startsWith(base));
  if (voices.length && !v) return 'novoice'; // không có giọng → mở Google Dịch thay vì đọc sai giọng
  if (v) u.voice = v;
  u.rate = 0.85;
  synth.speak(u);
  return 'ok';
}
const gtUrl = (text, lang, target) => {
  const base = lang.split('-')[0];
  const sl = base === 'fil' ? 'tl' : lang === 'zh-TW' ? 'zh-TW' : base;
  return `https://translate.google.com/?sl=${sl}&tl=${target}&text=${encodeURIComponent(text)}&op=translate`;
};
function SpeakButton({ text, lang }) {
  const { t } = useI18nSpeak();
  const [msg, setMsg] = useState('');
  return (
    <>
      <button
        type="button"
        className="say__btn"
        title={t('guide.listen')}
        aria-label={`${t('guide.listen')}: ${text}`}
        onClick={() => {
          const r = speakText(text, lang);
          if (r === 'ok') return setMsg('');
          // Máy không có giọng đọc ngôn ngữ này → mở Google Dịch ở tab mới (bấm loa ở đó để nghe)
          window.open(gtUrl(text, lang, t('guide.gtTarget')), '_blank', 'noopener');
          setMsg(t('guide.gtOpened'));
          setTimeout(() => setMsg(''), 8000);
        }}
      >
        🔊
      </button>
      {msg && (
        <small className="say__msg">
          {msg}{' '}
          <a href={gtUrl(text, lang, t('guide.gtTarget'))} target="_blank" rel="noopener noreferrer">
            {t('guide.gtListen')} ↗
          </a>
        </small>
      )}
    </>
  );
}

/** Món ăn: ảnh minh hoạ từ Wikipedia */
function FoodCard({ food }) {
  const { lang } = useI18nSpeak();
  const { src, loading } = useWikiThumb(food.wiki);
  return (
    <a className="food-card" href={`https://en.wikipedia.org/wiki/${encodeURIComponent(food.wiki.replace(/ /g, '_'))}`} target="_blank" rel="noopener noreferrer">
      <span className={`food-card__img ${loading ? 'is-loading' : ''}`}>{src ? <img src={src} alt={food.n} loading="lazy" /> : !loading && <span aria-hidden>🍜</span>}</span>
      <b>{(lang === 'vi' && food.vi) || food.n}</b>
    </a>
  );
}

/** Hiển thị **đậm**, *nghiêng* và [link](url) trong nội dung cẩm nang */
function Rich({ text, speak }) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<b key={m.index}>{m[1]}</b>);
    else if (m[2]) {
      const native = speak?.say?.[m[2].toLowerCase()];
      parts.push(
        native ? (
          <span key={m.index} className="say">
            <em>{m[2]}</em>
            <SpeakButton text={native} lang={speak.lang} />
          </span>
        ) : (
          <em key={m.index}>{m[2]}</em>
        ),
      );
    }
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
              {s.key === 'emergency' && <EmergencyList cc={g.cc} />}
              {(() => {
                const pts = toPoints(s.key, L(g[s.key]));
                return pts.length > 1 ? (
                  <ul className="guide-points">
                    {pts.map((x, k) => (
                      <li key={k}>
                        <Rich text={x} speak={s.key === 'phrases' ? GUIDE_PHRASES[g.cc] : null} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    <Rich text={pts[0] || ''} speak={s.key === 'phrases' ? GUIDE_PHRASES[g.cc] : null} />
                  </p>
                );
              })()}
              {s.key === 'food' && GUIDE_FOODS[g.cc] && (
                <>
                  <div className="food-grid">
                    {GUIDE_FOODS[g.cc].map((f) => (
                      <FoodCard key={f.n} food={f} />
                    ))}
                  </div>
                  <p className="tiny muted">{t('guide.foodCredit')}</p>
                </>
              )}
              {s.key === 'phrases' && GUIDE_PHRASES[g.cc] && <p className="tiny muted">{t('guide.listenHint')}</p>}
              {s.key === 'places' && can('guideToTrip') && GUIDE_SPOTS[g.cc] && <GuideSpots cc={g.cc} />}
              {s.key === 'places' && (
                <AppLink className="btn btn--soft btn--block guide-allmap" href={hrefCountry(g.cc)} onClick={() => openCountry(g.cc, 'famous')}>
                  🗺️ {t('guide.allOnMap', { country: countryName(g.cc) })} →
                </AppLink>
              )}
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
  const { user, trips, api, notify } = useApp();
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
      <div className="stack">
        {mine.length ? (
          <>
            <p className="small muted">{t('guide.pickTrip')}</p>
            {mine.map((tr) => (
              <button key={tr.id} type="button" className="btn btn--soft guide-trip" disabled={!!busy} onClick={() => add(tr)}>
                <span>{tr.emoji || '🧳'}</span> <b>{tr.name}</b>
                {busy === tr.id && <span className="muted"> …</span>}
              </button>
            ))}
          </>
        ) : (
          <p>{t('guide.noTrips')}</p>
        )}
        {/* Mở màn hình tạo chuyến đi ở tab mới — quay lại tab này, chuyến mới sẽ hiện trong danh sách */}
        <a className={`btn ${mine.length ? 'btn--ghost' : 'btn--primary'} guide-newtrip`} href="#/trips?new=1" target="_blank" rel="noopener">
          ＋ {t('guide.createTrip')} ↗
        </a>
        <small className="muted">{t('guide.newTabHint')}</small>
      </div>
    </Modal>
  );
}

const EM_ICON = { police: '👮', ambulance: '🚑', fire: '🚒', all: '🆘', tourist: '🧳', rescue: '⛑️' };
/** Số khẩn cấp: bấm để mở trình gọi điện của điện thoại */
function EmergencyList({ cc }) {
  const { t, lang } = useI18n();
  const list = GUIDE_EMERGENCY[cc] || [];
  return (
    <div className="em-list">
      {list.map((e) => (
        <a key={e.k + e.num} className="em-item" href={`tel:${e.num}`}>
          <span className="em-item__icon">{EM_ICON[e.k]}</span>
          <span className="em-item__main">
            <b>{t('em.' + e.k)}</b>
            {e.note && <small className="muted">{e.note[lang] || e.note.vi}</small>}
          </span>
          <span className="em-item__num">📞 {e.show}</span>
        </a>
      ))}
      {cc !== 'VN' && (
        <a className="em-item em-item--vn" href={`tel:${VN_CITIZEN_HOTLINE}`}>
          <span className="em-item__icon">🇻🇳</span>
          <span className="em-item__main">
            <b>{t('em.vnHotline')}</b>
            <small className="muted">{t('em.vnHotlineNote')}</small>
          </span>
          <span className="em-item__num">📞 +84 981 84 84 84</span>
        </a>
      )}
      <p className="tiny muted">{t('em.tapHint')}</p>
    </div>
  );
}
