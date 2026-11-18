// WebP nhẹ hơn JPEG ~25–35% cùng chất lượng; trình duyệt không mã hoá được WebP thì dùng JPEG
let webpOk = null;
export const supportsWebp = () => {
  if (webpOk == null) {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      webpOk = c.toDataURL('image/webp').startsWith('data:image/webp');
    } catch {
      webpOk = false;
    }
  }
  return webpOk;
};

/** Nén ảnh trước khi upload: cạnh dài tối đa `max` px, WebP (hoặc JPEG) chất lượng `q`. */
export async function compressImage(file, max = 1600, q = 0.85, type = supportsWebp() ? 'image/webp' : 'image/jpeg') {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    return await new Promise((res) => c.toBlob((b) => (b && b.type === type ? res(b) : c.toBlob(res, 'image/jpeg', q)), type, q));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function blobToDataURL(blob) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(blob);
  });
}

/** Nén ảnh thành data URL, tự giảm chất lượng/kích thước cho tới khi nhỏ hơn maxBytes. */
export async function compressToDataURL(file, max, q, maxBytes) {
  let size = max;
  let quality = q;
  for (let i = 0; i < 8; i++) {
    const url = await blobToDataURL(await compressImage(file, size, quality));
    if (url.length <= maxBytes) return url;
    if (quality > 0.55) quality -= 0.1;
    else size = Math.round(size * 0.8);
  }
  return blobToDataURL(await compressImage(file, 600, 0.5));
}
