import { useEffect, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

// Chỉ hiển thị tên bằng chữ Latin: nước ngoài → tên Latin/tiếng Anh (Seoul thay vì 서울),
// Việt Nam giữ tên tiếng Việt có dấu (vốn đã là chữ Latin).
const LATIN_LABEL = ['coalesce', ['get', 'name:latin'], ['get', 'name_en'], ['get', 'name:en'], ['get', 'name']];

async function loadStyle() {
  const style = await fetch(STYLE_URL).then((r) => {
    if (!r.ok) throw new Error('style');
    return r.json();
  });
  for (const layer of style.layers) {
    const tf = layer.layout?.['text-field'];
    if (tf && JSON.stringify(tf).includes('name')) layer.layout['text-field'] = LATIN_LABEL;
  }
  return style;
}

/** Bản đồ nền vector (MapLibre) — nếu không tải được thì dùng ảnh nền OpenStreetMap. */
export default function BaseMap() {
  const map = useMap();
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let layer;
    let cancelled = false;
    (async () => {
      try {
        const [style, mod] = await Promise.all([loadStyle(), import('@maplibre/maplibre-gl-leaflet')]);
        if (cancelled) return;
        layer = mod.maplibreGL({ style, attribution: ATTRIBUTION, interactive: false });
        layer.addTo(map);
      } catch {
        if (!cancelled) setFallback(true);
      }
    })();
    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map]);

  if (!fallback) return null;
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      className="base-tiles"
    />
  );
}
