/**
 * Feature flags — bật / tắt tính năng mới theo từng nhóm người dùng.
 *
 * Quy trình phát hành tính năng mới:
 *  1. Thêm 1 mục vào FLAGS bên dưới với `defaultOn: false`.
 *  2. Bọc phần giao diện bằng `can('<key>')` (lấy từ useApp()).
 *  3. Chủ trang (super admin) luôn thấy để thử; người khác chỉ thấy khi admin bật trong
 *     Quản trị → Tính năng: bật cho một số người dùng (thử trước) hoặc bật cho tất cả.
 *
 * Cấu hình lưu ở settings/site → flags: { [key]: { on: boolean, users: [uid] } }.
 * Chưa có cấu hình thì dùng `defaultOn`.
 */
export const FLAGS = [
  {
    key: 'tips',
    icon: '🧭',
    name: { vi: 'Kinh nghiệm theo quốc gia', en: 'Country travel tips' },
    desc: { vi: 'Người dùng đăng bài kinh nghiệm, bấm Hữu ích / Sai lệch, hỏi đáp.', en: 'Community tips with Helpful / Misleading votes and Q&A.' },
    since: '2026-11-19',
    defaultOn: false,
  },
  {
    key: 'guide',
    icon: '📖',
    name: { vi: 'Trang Cẩm nang', en: 'Guides page' },
    desc: { vi: 'Mục Cẩm nang trên thanh điều hướng.', en: 'The Guides item in the navigation.' },
    since: '2026-11-19',
    defaultOn: true,
  },
];
export const FLAG_BY_KEY = Object.fromEntries(FLAGS.map((f) => [f.key, f]));

/** Người dùng này có thấy tính năng `key` không */
export function flagAllows(key, settings, user, isSuper) {
  const def = FLAG_BY_KEY[key];
  if (!def) return true;
  if (isSuper) return true;
  const cfg = settings?.flags?.[key];
  const on = cfg?.on ?? def.defaultOn;
  if (on) return true;
  return !!user && (cfg?.users || []).includes(user.uid);
}
