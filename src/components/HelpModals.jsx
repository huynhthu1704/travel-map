import { useMemo, useState } from 'react';
import { Modal } from './ui';
import { useI18n } from '../i18n';
import { useApp } from '../AppContext';
import { normalize } from '../lib/geo';
import { FAQ } from '../data/faq';
import { SPONSOR, sponsorReady, vietQrUrl } from '../config/sponsor';

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

const fmtVnd = (n) => `${Number(n).toLocaleString('vi-VN')} ₫`;

/** Ủng hộ người làm Travel Map qua VietQR (quét bằng app ngân hàng / ví) */
export function SponsorModal({ onClose }) {
  const { t } = useI18n();
  const { notify, user } = useApp();
  const [amount, setAmount] = useState(SPONSOR.defaultAmount);
  const [custom, setCustom] = useState('');
  const value = custom ? Math.max(1000, Math.round(Number(custom.replace(/\D/g, '')) || 0)) : amount;
  const note = `${SPONSOR.note}${user?.name ? ` - ${user.name}` : ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').slice(0, 50);
  const ready = sponsorReady();
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(t('sponsor.copied'));
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
            <div className="chips">
              {SPONSOR.amounts.map((a) => (
                <button
                  key={a}
                  className={`chip ${!custom && amount === a ? 'chip--on' : ''}`}
                  onClick={() => {
                    setCustom('');
                    setAmount(a);
                  }}
                >
                  {a === 5000 ? '☕ ' : a === 10000 ? '🧋 ' : a === 20000 ? '🍜 ' : '🍰 '}
                  {fmtVnd(a)}
                </button>
              ))}
            </div>
            <label className="field">
              <span>{t('sponsor.custom')}</span>
              <input inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))} placeholder="5.000" />
            </label>
            <figure className="sponsor__qr">
              <img src={vietQrUrl(value, note)} alt={t('sponsor.qrAlt', { amount: fmtVnd(value) })} width="280" height="280" />
              <figcaption>
                <b>{fmtVnd(value)}</b>
                <small>{t('sponsor.scan')}</small>
              </figcaption>
            </figure>
            <div className="sponsor__bank">
              <div>
                <small className="muted">{SPONSOR.bankName || SPONSOR.bankId.toUpperCase()}</small>
                <b>{SPONSOR.accountNo}</b>
                <small>{SPONSOR.accountName}</small>
              </div>
              <button className="btn btn--sm btn--soft" onClick={() => copy(SPONSOR.accountNo)}>
                📋 {t('sponsor.copyAcc')}
              </button>
            </div>
            <p className="small muted">{t('sponsor.note', { note })}</p>
          </>
        )}
        <p className="small muted">{t('sponsor.thanks')}</p>
      </div>
    </Modal>
  );
}
