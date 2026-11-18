import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, GeoJSON, Marker, Tooltip, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from '../lib/leafletGlobal';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet/dist/leaflet.css';
import BaseMap from './BaseMap';
import { useApp } from '../AppContext';
import { famousIn } from '../data/places';
import { useI18n } from '../i18n';
import { countryName } from '../lib/countries';
import { pName } from '../lib/lang';

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
      map.flyToBounds([[s, w], [n, e]], { duration: 0.9, maxZoom: 13 });
    } else if (flyTarget.world) {
      map.flyTo([22, 15], map.getSize().x < 700 ? 1 : 2, { duration: 0.8 });
    } else if (flyTarget.lat != null) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 12, { duration: 0.9 });
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
    countries, visitedCountries, selectedCountry, places, memories, openPlace, tripStops, activeTripId, selectedPlace, pickMode, famousFor, famousLimit, homeCountry,
  } = useApp();
  const pickRef = useRef(pickMode);
  pickRef.current = pickMode;
  const geoRef = useRef();
  const { lang } = useI18n();

  const style = useMemo(
    () => (f) => {
      const cc = f.properties.cc;
      const visited = visitedCountries.has(cc);
      const sel = cc === selectedCountry;
      return {
        weight: sel ? 2.5 : 0.8,
        color: sel ? '#A87400' : visited ? '#D99A00' : '#CFC7BA',
        fillColor: visited ? '#FFC629' : '#FFFFFF',
        fillOpacity: visited ? (sel ? 0.55 : 0.45) : sel ? 0.35 : 0.05,
      };
    },
    [visitedCountries, selectedCountry],
  );

  const styleRef = useRef(style);
  styleRef.current = style;
  useEffect(() => {
    geoRef.current?.setStyle(style);
  }, [style]);

  // Marker: địa điểm của tôi (đã đến / muốn đi), địa điểm nổi tiếng của quốc gia đang xem, điểm dừng chuyến đi
  const markers = useMemo(() => {
    const m = new Map();
    // Địa điểm nổi tiếng: hiện tất cả, các điểm gần nhau sẽ được gom cụm
    const famousCc = selectedCountry || homeCountry;
    if (famousCc) famousFor(famousCc).forEach((p) => m.set(p.id, { place: p, kind: 'famous', emoji: p.emoji }));
    memories.forEach((mem) => mem.place && m.set(mem.place.id, { place: mem.place, kind: 'visited', emoji: '👣' }));
    places.forEach((p) => m.set(p.id, { place: p, kind: p.status, emoji: p.status === 'visited' ? '👣' : '💛' }));
    if (activeTripId)
      tripStops.forEach((s) => {
        if (!m.has(s.place.id) || m.get(s.place.id).kind === 'famous') m.set(s.place.id, { place: s.place, kind: 'trip', emoji: '🧳', by: s.byName });
      });
    if (selectedPlace && !m.has(selectedPlace.id)) m.set(selectedPlace.id, { place: selectedPlace, kind: 'search', emoji: selectedPlace.emoji || '📍' });
    return [...m.values()];
  }, [selectedCountry, homeCountry, places, memories, tripStops, activeTripId, selectedPlace, famousFor, famousLimit]);

  const renderMarker = ({ place, kind, emoji, by }) => (
    <Marker
      key={kind + place.id}
      position={[place.lat, place.lng]}
      icon={pinIcon(kind, emoji)}
      eventHandlers={{ click: () => openPlace(place, { fly: false }) }}
      zIndexOffset={kind === 'visited' ? 500 : kind === 'trip' ? 400 : 0}
    >
      <Tooltip direction="top">
        {pName(place)}
        {by ? ` · ${by}` : ''}
      </Tooltip>
    </Marker>
  );

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
          key={lang}
          ref={geoRef}
          data={countries}
          style={style}
          onEachFeature={(f, layer) => {
            // Không còn zoom vào quốc gia khi bấm: bấm bản đồ = ghim vị trí (xử lý ở PickHandler)
            layer.bindTooltip(f.properties.cc ? countryName(f.properties.cc) : f.properties.name, { sticky: true, className: 'country-tip', direction: 'top' });
          }}
        />
      )}
      <MarkerClusterGroup
        key={selectedCountry || homeCountry}
        chunkedLoading
        maxClusterRadius={55}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        iconCreateFunction={clusterIcon}
      >
        {markers.filter((x) => x.kind === 'famous').map(renderMarker)}
      </MarkerClusterGroup>
      {markers.filter((x) => x.kind !== 'famous').map(renderMarker)}
      <FlyController countries={countries} />
      <PickHandler />
    </MapContainer>
  );
}
