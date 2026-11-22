import { useEffect, useMemo, useRef } from 'react';
import { pickSelected } from '../lib/mapSelect';
import { MapContainer, GeoJSON, Marker, Polyline, Tooltip, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from '../lib/leafletGlobal';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet/dist/leaflet.css';
import BaseMap from './BaseMap';
import { useApp } from '../AppContext';
import { famousIn } from '../data/places';
import { useI18n } from '../i18n';
import { countryName } from '../lib/countries';
import { pName, getLocale } from '../lib/lang';

const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(getLocale(), { weekday: 'short', day: '2-digit', month: '2-digit' });

const mobileSheet = () => window.matchMedia('(max-width: 900px)').matches;
const iconCache = {};
function pinIcon(kind, emoji) {
  const key = kind + emoji;
  if (!iconCache[key]) {
    iconCache[key] = L.divIcon({
      className: '',
      html: `<div class="pin pin--${kind}"><span>${emoji}</span></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 36],
      tooltipAnchor: [0, -32],
    });
  }
  return iconCache[key];
}

/** REQ-005: ghim của địa điểm đang chọn — to hơn, viền mật ong, vòng sáng nhấp nháy nhẹ */
const selectedCache = {};
function selectedIcon(kind, emoji) {
  const key = kind + emoji;
  if (!selectedCache[key]) {
    selectedCache[key] = L.divIcon({
      className: 'pin-selected-wrap',
      html: `<span class="pin-selected__ring"></span><div class="pin pin--${kind} pin--selected"><span>${emoji}</span></div>`,
      iconSize: [56, 56],
      iconAnchor: [28, 52],
      tooltipAnchor: [0, -50],
    });
  }
  return selectedCache[key];
}

/** Biểu tượng cụm: vòng tròn vàng mật ong + số địa điểm */
function clusterIcon(cluster) {
  const n = cluster.getChildCount();
  const size = n < 10 ? 40 : n < 50 ? 48 : 56;
  return L.divIcon({
    className: '',
    html: `<div class="cluster" style="width:${size}px;height:${size}px"><span>🏞️</span><b>${n}</b></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function boundsForCountry(feature, cc) {
  const b = L.geoJSON(feature).getBounds();
  const span = b.getEast() - b.getWest();
  const famous = famousIn(cc);
  if (span > 120 && famous.length) return L.latLngBounds(famous.map((p) => [p.lat, p.lng])).pad(0.3);
  return b;
}

function FlyController({ countries }) {
  const map = useMap();
  const { flyTarget } = useApp();
  // Khi zoom gần (thành phố) làm nhạt lớp tô màu quốc gia để nhìn rõ đường phố
  // Báo cho bảng dưới (điện thoại) thu nhỏ khi người dùng kéo / chạm bản đồ
  useEffect(() => {
    const ping = () => window.dispatchEvent(new Event('map:interact'));
    map.on('dragstart', ping);
    map.on('click', ping);
    return () => {
      map.off('dragstart', ping);
      map.off('click', ping);
    };
  }, [map]);
  useEffect(() => {
    const sync = () => map.getContainer().classList.toggle('map--near', map.getZoom() >= 7);
    map.on('zoomend', sync);
    sync();
    return () => map.off('zoomend', sync);
  }, [map]);
  useEffect(() => {
    if (!flyTarget) return;
    if (flyTarget.country && countries) {
      const f = countries.features.find((x) => x.properties.cc === flyTarget.country);
      if (f) map.flyToBounds(boundsForCountry(f, flyTarget.country), { padding: [40, 40], duration: 0.9, maxZoom: 7 });
    } else if (flyTarget.bbox) {
      const [s, n, w, e] = flyTarget.bbox;
      // Chừa chỗ cho bảng bên trái (máy tính) để không che mất điểm nào
      const wide = map.getSize().x >= 900;
      const bottom = mobileSheet() ? Math.round(map.getSize().y * 0.5) + 20 : 40;
      map.flyToBounds([[s, w], [n, e]], { duration: 0.9, maxZoom: 13, paddingTopLeft: wide ? [440, 80] : [30, 80], paddingBottomRight: [40, bottom] });
    } else if (flyTarget.world) {
      map.flyTo([22, 15], map.getSize().x < 700 ? 1 : 2, { duration: 0.8 });
    } else if (flyTarget.lat != null && flyTarget.focus) {
      // Xem nhanh từ danh sách: bay mượt tới địa danh, zoom gần, đặt vào giữa phần bản đồ không bị bảng che
      const z = flyTarget.zoom || 15;
      const ll = L.latLng(flyTarget.lat, flyTarget.lng);
      const mapRect = map.getContainer().getBoundingClientRect();
      const panel = document.querySelector('.panel')?.getBoundingClientRect();
      let dx = 0;
      let dy = 0;
      if (panel && panel.width && panel.height) {
        if (mobileSheet()) dy = Math.max(0, mapRect.bottom - panel.top) / 2;
        else dx = Math.max(0, panel.right - mapRect.left) / 2;
      }
      const target = map.unproject(map.project(ll, z).add([-dx, dy]), z);
      // Thời gian bay theo quãng đường: gần thì nhanh, xa thì chậm để mắt theo kịp
      const far = map.getCenter().distanceTo(ll) / 1000; // km
      const duration = Math.min(2.6, 1.1 + Math.log10(1 + far) * 0.45);
      map.flyTo(target, z, { duration, easeLinearity: 0.15 });
      // Đáp xuống → nhấp nháy vòng sáng ở đúng địa danh
      const pulse = () => {
        const m = L.marker(ll, { icon: L.divIcon({ className: 'focus-pulse', html: '<i></i><i></i>', iconSize: [24, 24] }), interactive: false, keyboard: false }).addTo(map);
        setTimeout(() => m.remove(), 3200);
      };
      map.once('moveend', pulse);
      return () => map.off('moveend', pulse);
    } else if (flyTarget.lat != null) {
      const z = flyTarget.zoom || 12;
      // Điện thoại: bảng dưới che nửa dưới bản đồ → đặt điểm vào giữa phần bản đồ còn thấy
      const covered = mobileSheet() ? map.getSize().y * 0.5 : 0;
      const target = covered ? map.unproject(map.project([flyTarget.lat, flyTarget.lng], z).add([0, covered / 2]), z) : [flyTarget.lat, flyTarget.lng];
      map.flyTo(target, z, { duration: 0.9 });
    }
  }, [flyTarget, countries, map]);
  return null;
}

/** Chọn vị trí: bấm khi đang ở chế độ chọn, hoặc chạm giữ / chuột phải bất kỳ lúc nào */
function PickHandler() {
  const { pickMode, setPickMode, pinPlace, addPickedAt } = useApp();
  const map = useMap();
  const clickTimer = useRef(null);
  useEffect(() => {
    map.getContainer().classList.toggle('map--picking', !!pickMode);
  }, [pickMode, map]);
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      // Đợi một chút để không ghim khi người dùng nhấp đúp để phóng to
      clearTimeout(clickTimer.current);
      clickTimer.current = setTimeout(() => {
        if (pickMode === 'place') addPickedAt(lat, lng);
        else if (pickMode === 'memory') {
          setPickMode(null);
          pinPlace(lat, lng, { purpose: 'memory' });
        } else pinPlace(lat, lng); // chạm bất kỳ đâu = chọn vị trí đó để thêm
      }, 260);
    },
    dblclick: () => clearTimeout(clickTimer.current),
    contextmenu: (e) => {
      if (pickMode === 'place') return addPickedAt(e.latlng.lat, e.latlng.lng);
      setPickMode(null);
      pinPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapView() {
  const {
    countries, visitedCountries, selectedCountry, places, memories, openPlace, tripStops, tripPlan, activeTripId, selectedPlace, pickMode, famousFor, famousLimit, homeCountry, can,
  } = useApp();
  const pickRef = useRef(pickMode);
  pickRef.current = pickMode;
  const geoRef = useRef();
  const { lang } = useI18n();

  const planAll = useMemo(() => (activeTripId ? tripPlan.filter((it) => it.tripId === activeTripId && it.place) : []), [activeTripId, tripPlan]);
  const planOrder = useMemo(() => planAll.filter((it) => !it.skipped), [planAll]);
  // Tô màu quốc gia: của chuyến đi đang xem, hoặc tất cả quốc gia đã đến
  const shownCountries = useMemo(
    () =>
      activeTripId
        ? new Set([...tripStops.filter((s) => s.tripId === activeTripId), ...planOrder].map((s) => s.place?.country).filter(Boolean))
        : visitedCountries,
    [activeTripId, tripStops, planOrder, visitedCountries],
  );
  const style = useMemo(
    () => (f) => {
      const cc = f.properties.cc;
      const visited = shownCountries.has(cc);
      const sel = cc === selectedCountry;
      return {
        weight: sel ? 2.5 : 0.8,
        color: sel ? '#A87400' : visited ? '#D99A00' : '#CFC7BA',
        fillColor: visited ? '#FFC629' : '#FFFFFF',
        fillOpacity: visited ? (sel ? 0.55 : 0.45) : sel ? 0.35 : 0.05,
      };
    },
    [shownCountries, selectedCountry],
  );

  const styleRef = useRef(style);
  styleRef.current = style;
  useEffect(() => {
    geoRef.current?.setStyle(style);
  }, [style]);

  // Marker: địa điểm của tôi (đã đến / muốn đi), địa điểm nổi tiếng của quốc gia đang xem, điểm dừng chuyến đi
  const markers = useMemo(() => {
    const m = new Map();
    // Đang xem 1 chuyến đi: chỉ hiện các điểm dừng của chuyến đó
    if (activeTripId) {
      tripStops
        .filter((s) => s.tripId === activeTripId && s.place)
        .forEach((s) => m.set(s.place.id, { place: s.place, kind: 'trip', emoji: s.kind === 'wishlist' ? '💛' : '👣', by: s.byName }));
      // Kế hoạch: đánh số đúng như trong trang Kế hoạch (đã đi = ghim xanh, vẫn giữ số)
      planAll.forEach((it, i) => {
        if (it.skipped) return void m.delete(it.place.id); // không đi → không hiện trên lộ trình
        const when = [it.date && fmtDay(it.date), it.time].filter(Boolean).join(' · ');
        m.set(it.place.id, { place: it.place, kind: it.done ? 'plandone' : 'plan', emoji: String(i + 1), by: when });
      });
      if (selectedPlace && !m.has(selectedPlace.id)) m.set(selectedPlace.id, { place: selectedPlace, kind: 'search', emoji: selectedPlace.emoji || '📍' });
      return [...m.values()];
    }
    // Địa điểm nổi tiếng: hiện tất cả, các điểm gần nhau sẽ được gom cụm
    const famousCc = selectedCountry || homeCountry;
    if (famousCc) famousFor(famousCc).forEach((p) => m.set(p.id, { place: p, kind: 'famous', emoji: p.emoji }));
    memories.forEach((mem) => mem.place && m.set(mem.place.id, { place: mem.place, kind: 'visited', emoji: '👣' }));
    places.forEach((p) => m.set(p.id, { place: p, kind: p.status, emoji: p.status === 'visited' ? '👣' : '💛' }));
    if (selectedPlace && !m.has(selectedPlace.id)) m.set(selectedPlace.id, { place: selectedPlace, kind: 'search', emoji: selectedPlace.emoji || '📍' });
    return [...m.values()];
  }, [selectedCountry, homeCountry, places, memories, tripStops, planAll, activeTripId, selectedPlace, famousFor, famousLimit]);

  const renderMarker = ({ place, kind, emoji, by }) => (
    <Marker
      key={kind + place.id}
      position={[place.lat, place.lng]}
      icon={pinIcon(kind, emoji)}
      eventHandlers={{ click: () => openPlace(place, { fly: false }) }}
      zIndexOffset={kind === 'visited' ? 500 : kind === 'trip' || kind === 'plan' || kind === 'plandone' ? 400 : 0}
    >
      <Tooltip direction="top">
        {kind === 'plan' || kind === 'plandone' ? `${emoji}. ` : ''}
        {pName(place)}
        {by ? ` · ${by}` : ''}
      </Tooltip>
    </Marker>
  );

  // REQ-005: địa điểm đang chọn được vẽ riêng (không gom cụm, nằm trên cùng, có nhãn tên)
  const { selected, rest } = can?.('selectedPin') ? pickSelected(markers, selectedPlace?.id) : { selected: null, rest: markers };

  return (
    <MapContainer
      className="map"
      center={[22, 15]}
      zoom={window.innerWidth < 700 ? 1 : 2}
      minZoom={1}
      maxZoom={19}
      worldCopyJump
      zoomControl={false}
      maxBounds={[[-85, -400], [85, 400]]}
    >
      <BaseMap />
      <ZoomControl position="bottomright" />
      {countries && (
        <GeoJSON
          key={`${lang}-${countries.features.length}`}
          ref={geoRef}
          data={countries}
          style={style}
          onEachFeature={(f, layer) => {
            // Không còn zoom vào quốc gia khi bấm: bấm bản đồ = ghim vị trí (xử lý ở PickHandler)
            layer.bindTooltip(f.properties.cc ? countryName(f.properties.cc) : f.properties.name, { sticky: true, className: 'country-tip', direction: 'top' });
          }}
        />
      )}
      {planOrder.length > 1 && (
        <Polyline positions={planOrder.map((it) => [it.place.lat, it.place.lng])} pathOptions={{ color: '#E0A100', weight: 3, dashArray: '6 8', opacity: 0.9 }} />
      )}
      <MarkerClusterGroup
        key={activeTripId ? `trip-${activeTripId}` : selectedCountry || homeCountry}
        chunkedLoading
        maxClusterRadius={55}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        iconCreateFunction={clusterIcon}
      >
        {rest.filter((x) => x.kind === 'famous').map(renderMarker)}
      </MarkerClusterGroup>
      {rest.filter((x) => x.kind !== 'famous').map(renderMarker)}
      {selected && (
        <Marker
          key={`selected-${selected.place.id}`}
          position={[selected.place.lat, selected.place.lng]}
          icon={selectedIcon(selected.kind, selected.emoji)}
          zIndexOffset={2000}
          eventHandlers={{ click: () => openPlace(selected.place, { fly: false }) }}
        >
          <Tooltip direction="top" permanent className="pin-selected__label">
            {selected.kind === 'plan' || selected.kind === 'plandone' ? `${selected.emoji}. ` : ''}
            {pName(selected.place)}
          </Tooltip>
        </Marker>
      )}
      <FlyController countries={countries} />
      <PickHandler />
    </MapContainer>
  );
}
