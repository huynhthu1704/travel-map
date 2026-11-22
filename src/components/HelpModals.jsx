import { useEffect, useMemo, useState } from 'react';
import { Modal } from './ui';
import { useI18n } from '../i18n';
import { useApp } from '../AppContext';
import { normalize } from '../lib/geo';
import { FAQ } from '../data/faq';
import { RELEASES } from '../data/releases';
import { markReleaseSeen } from '../lib/release';
import { SPONSOR, sponsorReady } from '../config/sponsor';

/** Câu hỏi thường gặp: tìm nhanh + mở / đóng từng câu */
export function FaqModal({ onClose }) {
  const { t, lang } = useI18n();
  const { setModal } = useApp();
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const n = normalize(q.trim());
    const all = FAQ[lang] || FAQ.vi;
    if (!n) return all;
    return all
      .map((g) => ({ ...g, items: g.items.filter(([qq, a]) => normalize(`${qq} ${a}`).includes(n)) }))
      .filter((g) => g.items.length);
  }, [q, lang]);
  return (
    <Modal title={`❓ ${t('faq.title')}`} onClose={onClose}>
      <div className="stack faq">
        <input className="grouped__search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('faq.search')} autoFocus />
        {groups.map((g) => (
          <section key={g.group} className="stack-sm">
            <h3 className="section-title">{g.group}</h3>
            {g.items.map(([qq, a]) => (
              <details key={qq} className="faq__item" open={!!q.trim()}>
                <summary>{qq}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        ))}
        {!groups.length && <p className="muted small">{t('faq.none')}</p>}
        <div className="callout">
          <b>{t('faq.moreTitle')}</b>
          <p>{t('faq.moreText')}</p>
          <button className="btn btn--primary" onClick={() => setModal({ type: 'sponsor' })}>
            ☕ {t('sponsor.open')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** Ủng hộ người làm Bee There: quét mã VietQR bằng app ngân hàng / ví */
export function SponsorModal({ onClose }) {
  const { t } = useI18n();
  const { notify } = useApp();
  const ready = sponsorReady();
  const copy = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(msg);
    } catch {
      notify(text);
    }
  };
  return (
    <Modal title={`☕ ${t('sponsor.title')}`} onClose={onClose} className="modal--sm">
      <div className="stack sponsor">
        <p>{t('sponsor.intro')}</p>
        {!ready ? (
          <div className="callout">
            <b>{t('sponsor.soonTitle')}</b>
            <p>{t('sponsor.soonText')}</p>
          </div>
        ) : (
          <>
            <figure className="sponsor__qr">
              <img src={`${import.meta.env.BASE_URL}${SPONSOR.qrImage}`} alt={t('sponsor.qrAlt')} width="320" height="352" />
              <figcaption>
                <small>{t('sponsor.scan')}</small>
              </figcaption>
            </figure>
            <div className="sponsor__bank">
              <div>
                <small className="muted">{SPONSOR.bankName}</small>
                <b>{SPONSOR.accountNoDisplay || SPONSOR.accountNo}</b>
                <small>{SPONSOR.accountName}</small>
              </div>
              <button className="btn btn--sm btn--soft" onClick={() => copy(SPONSOR.accountNo, t('sponsor.copied'))}>
                📋 {t('sponsor.copyAcc')}
              </button>
            </div>
            <p className="small muted">
              {t('sponsor.noteHint')} <b>{SPONSOR.note}</b>{' '}
              <button className="link" onClick={() => copy(SPONSOR.note, t('sponsor.noteCopied'))}>
                ({t('sponsor.copyNote')})
              </button>
            </p>
          </>
        )}
        <p className="small muted">{t('sponsor.thanks')}</p>
      </div>
    </Modal>
  );
}

/** Có gì mới: ghi chú phát hành, gộp theo ngày, mỗi mục có mô tả ngắn + ảnh minh hoạ (nếu có) */
export function WhatsNewModal({ onClose }) {
  const { t, lang } = useI18n();
  const [zoom, setZoom] = useState(null);
  useEffect(() => markReleaseSeen(), []);
  const days = useMemo(() => {
    const g = new Map();
    RELEASES.forEach((r) => {
      if (!g.has(r.date)) g.set(r.date, []);
      g.get(r.date).push(r);
    });
    return [...g.entries()];
  }, []);
  const L = (o) => (o ? o[lang] || o.vi : '');
  const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <Modal title={`🆕 ${t('rn.title')}`} onClose={onClose}>
      <div className="stack rn">
        <div className="rn__current">
          <span>{t('rn.current')}</span>
          <b>v{__APP_VERSION__}</b>
        </div>
        {days.map(([day, list]) => (
          <section key={day} className="rn__day">
            <h3 className="rn__date">📅 {fmtDay(day)}</h3>
            {list.map((r) => (
              <div key={r.version} className="rn__release">
                <div className="rn__ver">
                  <span className="rn__tag">v{r.version}</span>
                  {r.version === __APP_VERSION__ && <span className="rn__now">{t('rn.yours')}</span>}
                </div>
                {r.items.map((it) => (
                  <article key={L(it.title)} className="rn__item">
                    <div className="rn__icon">{it.icon}</div>
                    <div className="rn__body">
                      <b>{L(it.title)}</b>
                      <p>{L(it.desc)}</p>
                      {it.image && (
                        <button className="rn__img" onClick={() => setZoom(it.image)} title={t('rn.zoom')}>
                          <img src={`${import.meta.env.BASE_URL}${it.image}`} alt={L(it.title)} loading="lazy" />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
      {zoom && (
        <div className="rn__zoom" onClick={() => setZoom(null)} role="dialog">
          <img src={`${import.meta.env.BASE_URL}${zoom}`} alt="" />
        </div>
      )}
    </Modal>
  );
}
