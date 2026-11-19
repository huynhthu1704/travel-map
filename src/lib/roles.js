/**
 * Vai trò & quyền trong trang quản trị.
 *
 * - 'user'  : người dùng thường, không có quyền quản trị.
 * - 'admin' : toàn quyền (kể cả gán vai trò, sửa vai trò & quyền).
 * - Vai trò có sẵn (editor, moderator, marketing) và vai trò tự tạo: có danh sách quyền riêng,
 *   lưu ở settings/site → rolePerms { [roleId]: [perm] } và roleDefs [{ id, name:{vi,en}, icon }].
 *
 * Luật Firestore (firestore.rules → hasPerm) dùng cùng danh sách quyền mặc định bên dưới —
 * đổi ở đây thì đổi cả ở đó.
 */
export const PERMS = [
  { key: 'insights', icon: '📊' },
  { key: 'content', icon: '🖼️' },
  { key: 'feedback', icon: '💬' },
  { key: 'places', icon: '🏞️' },
  { key: 'guides', icon: '📖' },
  { key: 'tips', icon: '🧭' },
  { key: 'trips', icon: '🧳' },
  { key: 'announce', icon: '📢' },
  { key: 'notify', icon: '📣' },
  { key: 'ads', icon: '🪧' },
  { key: 'gear', icon: '🎒' },
  { key: 'flags', icon: '🚦' },
  { key: 'settings', icon: '⚙️' },
  { key: 'logs', icon: '📜' },
];
export const PERM_KEYS = PERMS.map((p) => p.key);

export const PRESET_ROLES = [
  { id: 'editor', icon: '✏️', perms: ['content', 'feedback', 'places', 'tips', 'guides'] },
  { id: 'moderator', icon: '🛡️', perms: ['content', 'feedback', 'tips'] },
  { id: 'marketing', icon: '📣', perms: ['insights', 'announce', 'notify', 'ads', 'gear'] },
];
const PRESET_BY_ID = Object.fromEntries(PRESET_ROLES.map((r) => [r.id, r]));
export const isPresetRole = (id) => !!PRESET_BY_ID[id];

/** Danh sách tất cả vai trò (gồm user, admin, có sẵn, tự tạo) theo cài đặt trang */
export function allRoles(settings) {
  const custom = (settings?.roleDefs || []).filter((r) => r && r.id && !PRESET_BY_ID[r.id] && r.id !== 'user' && r.id !== 'admin');
  return [
    { id: 'user', icon: '🙂', perms: [], fixed: true },
    ...PRESET_ROLES.map((r) => ({ ...r, perms: settings?.rolePerms?.[r.id] ?? r.perms, preset: true })),
    ...custom.map((r) => ({ ...r, perms: settings?.rolePerms?.[r.id] ?? [], custom: true })),
    { id: 'admin', icon: '👑', perms: PERM_KEYS, fixed: true },
  ];
}

export function permsOf(role, settings) {
  if (role === 'admin') return PERM_KEYS;
  if (!role || role === 'user') return [];
  return settings?.rolePerms?.[role] ?? PRESET_BY_ID[role]?.perms ?? [];
}

/** Tên vai trò để hiển thị */
export function roleLabel(id, settings, t, lang) {
  if (id === 'user' || id === 'admin' || PRESET_BY_ID[id]) return t('role.' + id);
  const def = (settings?.roleDefs || []).find((r) => r.id === id);
  return def ? def.name?.[lang] || def.name?.vi || def.name?.en || id : id;
}
