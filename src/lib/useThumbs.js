import { useEffect, useState } from 'react';
import { api } from './store';

/** Số ảnh của 1 kỉ niệm (document có thể chỉ giữ ảnh bìa) */
export const photoCountOf = (m) => Math.max(m?.photoCount || 0, m?.photos?.length || 0);

/** Tất cả ảnh thu nhỏ của 1 kỉ niệm: trả ngay ảnh có sẵn, tải phần còn lại khi cần */
export function useThumbs(mem) {
  const [list, setList] = useState(() => mem?.allThumbs || mem?.photos || []);
  useEffect(() => {
    let alive = true;
    setList(mem?.allThumbs || mem?.photos || []);
    if (mem && photoCountOf(mem) > (mem.photos?.length || 0)) api.getThumbs(mem).then((l) => alive && l?.length && setList(l));
    return () => {
      alive = false;
    };
  }, [mem?.id, mem?.photos?.length, mem?.photoCount]); // eslint-disable-line react-hooks/exhaustive-deps
  return list;
}
