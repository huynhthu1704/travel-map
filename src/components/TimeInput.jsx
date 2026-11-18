import { useI18n } from '../i18n';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

/**
 * Chọn giờ dạng 24h (HH:MM). Chọn giờ thì phút mặc định là "00"
 * (ô giờ của trình duyệt tự điền phút hiện tại, dễ nhầm). value '' = chưa chọn.
 */
export default function TimeInput({ value = '', onChange, ariaLabel }) {
  const { t } = useI18n();
  const [h, m] = value ? value.split(':') : ['', ''];
  const minutes = m && !MINUTES.includes(m) ? [...MINUTES, m].sort() : MINUTES;
  return (
    <div className="time-input" role="group" aria-label={ariaLabel}>
      <select value={h} onChange={(e) => onChange(e.target.value ? `${e.target.value}:${m || '00'}` : '')} aria-label={t('time.hour')}>
        <option value="">--</option>
        {HOURS.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <span>:</span>
      <select value={h ? m || '00' : ''} disabled={!h} onChange={(e) => onChange(`${h}:${e.target.value}`)} aria-label={t('time.minute')}>
        {!h && <option value="">--</option>}
        {minutes.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      {value && (
        <button type="button" className="icon-btn icon-btn--sm time-input__clear" onClick={() => onChange('')} aria-label={t('time.clear')}>
          ✕
        </button>
      )}
    </div>
  );
}
