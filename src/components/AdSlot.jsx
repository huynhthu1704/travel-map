import { useApp } from '../AppContext';
import { useI18n } from '../i18n';

/**
 * Ô quảng cáo MẪU (chưa phải quảng cáo thật) để xem trước vị trí và kích thước.
 * Quản trị → Quảng cáo: 'off' (tắt) | 'staff' (chỉ quản trị / biên tập viên thấy) | 'all' (mọi người).
 * Khi tích hợp quảng cáo thật (AdSense / đối tác), thay phần thân bên dưới bằng mã của nhà quảng cáo,
 * giữ nguyên khung (kích thước cố định để trang không bị nhảy khi quảng cáo tải xong).
 */
const SIZES = {
  banner: { w: 728, h: 90, mobileH: 100, label: '728×90 · 320×100' },
  card: { w: 300, h: 250, label: '300×250' },
  inline: { w: 468, h: 60, mobileH: 60, label: '468×60 · 320×50' },
};

/** Nhóm vị trí quảng cáo (phần trước dấu '-' của placement) — quản lý ở Quản trị → Quảng cáo */
export const AD_PLACEMENTS = [
  { id: 'home', icon: '🗺️', size: 'card' },
  { id: 'place', icon: '📍', size: 'banner' },
  { id: 'explore', icon: '🌍', size: 'inline' },
  { id: 'memories', icon: '📸', size: 'banner' },
  { id: 'trip', icon: '🧳', size: 'banner' },
  { id: 'profile', icon: '👤', size: 'banner' },
  { id: 'guide', icon: '📖', size: 'banner' },
  { id: 'tips', icon: '🧭', size: 'banner' },
];
export const adGroup = (placement = '') => placement.split('-')[0];

export default function AdSlot({ placement, size = 'banner' }) {
  const { settings, isStaff } = useApp();
  const { t } = useI18n();
  const mode = settings?.ads?.mode || settings?.features?.ads || 'staff';
  if (mode === 'off' || (mode === 'staff' && !isStaff)) return null;
  if ((settings?.ads?.off || []).includes(adGroup(placement))) return null;
  const sz = SIZES[size] || SIZES.banner;
  return (
    <aside className={`ad-slot ad-slot--${size}`} style={{ '--ad-h': `${sz.h}px`, '--ad-mh': `${sz.mobileH || sz.h}px` }} aria-label={t('ads.label')} data-placement={placement}>
      <span className="ad-slot__tag">{t('ads.label')}</span>
      <div className="ad-slot__body">
        <span className="ad-slot__emoji" aria-hidden>
          {size === 'card' ? '🧳' : '✈️'}
        </span>
        <span className="ad-slot__text">
          <b>{t('ads.sampleTitle')}</b>
          <small>
            {t('ads.sampleSub')} · {sz.label} · {placement}
          </small>
        </span>
      </div>
    </aside>
  );
}
