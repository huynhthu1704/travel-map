import { useI18n } from '../i18n';

/** #/guide — Cẩm nang du lịch (đang chuẩn bị) */
const SOON = ['🛂', '🌤️', '💸', '🍜', '🚆', '🗣️'];
const TEASER = ['🇻🇳', '🇹🇭', '🇯🇵', '🇰🇷', '🇸🇬', '🇲🇾', '🇮🇩', '🇨🇳', '🇹🇼', '🇵🇭', '🇰🇭', '🇱🇦'];

export default function GuidePage() {
  const { t } = useI18n();
  return (
    <div className="page guide">
      <section className="guide-soon card">
        <span className="guide-soon__badge">{t('guide.soon')}</span>
        <div className="guide-soon__art" aria-hidden>
          📖<span>✈️</span>
        </div>
        <h1 className="h1">{t('guide.title')}</h1>
        <p className="muted guide-soon__lead">{t('guide.lead')}</p>
        <div className="guide-soon__flags" aria-hidden>
          {TEASER.map((f) => (
            <span key={f}>{f}</span>
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
