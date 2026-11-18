/** Cắt ảnh vuông ở giữa, thu về 256px, nén JPEG/WebP (≈ 20 KB) */
export async function makeAvatar(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    let q = 0.85;
    let out = c.toDataURL('image/jpeg', q);
    while (out.length > 100000 && q > 0.4) out = c.toDataURL('image/jpeg', (q -= 0.1));
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

