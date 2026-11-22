import { useI18n } from '../i18n';

/** Thẻ giới thiệu trang Đồ dùng du lịch — đặt ở Cẩm nang và tab Checklist của chuyến đi */
export default function GearPromo() {
  const { t } = useI18n();
  return (
    <a className="gear-promo card" href="#/gear">
      <span className="gear-promo__icon" aria-hidden>
        🎒
      </span>
      <span className="gear-promo__text">
        <b>{t('gear.promoTitle')}</b>
        <small>{t('gear.promoSub')}</small>
      </span>
      <span className="btn btn--sm btn--primary">{t('gear.promoBtn')} →</span>
    </a>
  );
}

