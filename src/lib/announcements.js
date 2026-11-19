/**
 * Thông báo đầu trang (site announcement) có lịch.
 * settings.announcements: [{ id, vi, en, tone: 'info'|'success'|'warning', startAt, endAt, createdAt }]
 * startAt / endAt là mốc thời gian (ms); endAt = null → hiện đến khi tắt. Thông báo cũ (settings.announcement) vẫn dùng được.
 */
export function announcementStatus(a, now = Date.now()) {
  if (a.paused) return 'paused';
  if (a.startAt && now < a.startAt) return 'scheduled';
  if (a.endAt && now >= a.endAt) return 'ended';
  return 'live';
}

export function currentAnnouncement(settings, now = Date.now()) {
  const live = (settings?.announcements || [])
    .filter((a) => (a.vi || a.en) && announcementStatus(a, now) === 'live')
    .sort((a, b) => (b.startAt || b.createdAt || 0) - (a.startAt || a.createdAt || 0));
  if (live[0]) return live[0];
  const old = settings?.announcement;
  return old?.active && (old.vi || old.en) ? old : null;
}

/** Mẫu có sẵn — {date} / {time} được thay bằng ngày giờ bắt đầu khi chọn mẫu */
export const ANNOUNCEMENT_TEMPLATES = [
  {
    id: 'upcoming',
    icon: '🚀',
    tone: 'success',
    vi: '🚀 Sắp ra mắt: [tên tính năng] — có mặt từ {date}. Hẹn gặp bạn!',
    en: '🚀 Coming soon: [feature name] — arriving {date}. Stay tuned!',
  },
  {
    id: 'launched',
    icon: '🎉',
    tone: 'success',
    vi: '🎉 Tính năng mới: [tên tính năng] đã có trên Travel Map — thử ngay nhé!',
    en: '🎉 New: [feature name] is now live on Travel Map — give it a try!',
  },
  {
    id: 'maintenance',
    icon: '🛠️',
    tone: 'warning',
    vi: '🛠️ Bảo trì hệ thống lúc {time} ngày {date} (khoảng 30 phút). Trong thời gian này trang có thể chậm hoặc tạm ngừng lưu dữ liệu.',
    en: '🛠️ Scheduled maintenance at {time} on {date} (about 30 minutes). The site may be slow or unable to save during this time.',
  },
  {
    id: 'info',
    icon: 'ℹ️',
    tone: 'info',
    vi: 'ℹ️ ',
    en: 'ℹ️ ',
  },
];
