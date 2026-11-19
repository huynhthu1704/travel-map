import { useI18n } from '../i18n';
import { useApp } from '../AppContext';

/** #/guide — Cẩm nang du lịch (đang chuẩn bị) */
const SOON = ['🛂', '🌤️', '💸', '🍜', '🚆', '🗣️'];
const TEASER = ['VN', 'TH', 'JP', 'KR', 'SG', 'MY', 'ID', 'CN', 'TW', 'PH', 'KH', 'LA'];
const flag = (cc) => String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0)));

export default function GuidePage() {
  const { t } = useI18n();
  const { openTips } = useApp();
  return (
    <div className="page guide">
      <section className="guide-soon card">
        <span className="guide-soon__badge">{t('guide.soon')}</span>
        <div className="guide-soon__art" aria-hidden>
          📖<span>✈️</span>
        </div>
        <h1 className="h1">{t('guide.title')}</h1>
        <p className="muted guide-soon__lead">{t('guide.lead')}</p>
        <p className="small"><b>{t('guide.tipsNow')}</b></p>
        <div className="guide-soon__flags">
          {TEASER.map((cc) => (
            <a key={cc} href={`#/tips/${cc}`} title={t('guide.tipsFor')} onClick={(e) => (e.preventDefault(), openTips(cc))}>
              {flag(cc)}
            </a>
          ))}
        </div>
        <ul className="guide-soon__list">
          {SOON.map((ic, i) => (
            <li key={ic}>
              <span>{ic}</span>
              <b>{t(`guide.item${i + 1}`)}</b>
            </li>
          ))}
        </ul>
        <p className="small muted">{t('guide.note')}</p>
      </section>
    </div>
  );
}
