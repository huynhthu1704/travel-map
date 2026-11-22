/** REQ-019: đổi nội dung 1 việc trong checklist — giữ nguyên trạng thái đã tick, người lo, phạm vi */
export const CHECK_ITEM_MAX = 120;
export function renameCheckItem(items, id, text) {
  const v = String(text || '').trim().slice(0, CHECK_ITEM_MAX);
  if (!v) return null; // để trống → không lưu (muốn xoá thì dùng nút ✕)
  let changed = false;
  const next = (items || []).map((x) => {
    if (x.id !== id || x.text === v) return x;
    changed = true;
    return { ...x, text: v };
  });
  return changed ? next : null;
}
