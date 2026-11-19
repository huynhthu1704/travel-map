import { Fragment } from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../AppContext';
import { countryName, flagOf } from '../lib/countries';
import { hrefCountry } from '../lib/route';
import { AppLink } from '../components/ui';
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
              <p>
                <Rich text={L(g[s.key])} />
              </p>
            </section>
            {i === 3 && <AdSlot placement={`guide-${g.cc}`} size="inline" />}
          </Fragment>
        ))}
      </div>
      <p className="tiny muted guide__note">{t('guide.checked', { date: GUIDES_CHECKED })}</p>
    </div>
  );
}
