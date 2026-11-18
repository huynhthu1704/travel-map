import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../AppContext';
import { famousIn } from '../data/places';

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

export default function MapView() {
  const {
    countries, visitedCountries, selectedCountry, openCountry, places, memories, openPlace, tripStops, activeTripId, selectedPlace,
  } = useApp();
  const geoRef = useRef();

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
    if (selectedCountry) famousIn(selectedCountry).forEach((p) => m.set(p.id, { place: p, kind: 'famous', emoji: p.emoji }));
    memories.forEach((mem) => mem.place && m.set(mem.place.id, { place: mem.place, kind: 'visited', emoji: '👣' }));
    places.forEach((p) => m.set(p.id, { place: p, kind: p.status, emoji: p.status === 'visited' ? '👣' : '💛' }));
    if (activeTripId)
      tripStops.forEach((s) => {
        if (!m.has(s.place.id) || m.get(s.place.id).kind === 'famous') m.set(s.place.id, { place: s.place, kind: 'trip', emoji: '🧳', by: s.byName });
      });
    if (selectedPlace && !m.has(selectedPlace.id)) m.set(selectedPlace.id, { place: selectedPlace, kind: 'search', emoji: selectedPlace.emoji || '📍' });
    return [...m.values()];
  }, [selectedCountry, places, memories, tripStops, activeTripId, selectedPlace]);

  return (
    <MapContainer
      className="map"
      center={[22, 15]}
      zoom={window.innerWidth < 700 ? 1 : 2}
      minZoom={1}
      worldCopyJump
      zoomControl={false}
      maxBounds={[[-85, -400], [85, 400]]}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="base-tiles"
      />
      <ZoomControl position="bottomright" />
      {countries && (
        <GeoJSON
          ref={geoRef}
          data={countries}
          style={style}
          onEachFeature={(f, layer) => {
            layer.on({
              click: () => f.properties.cc && openCountry(f.properties.cc),
              mouseover: (e) => e.target.setStyle({ fillOpacity: 0.6, fillColor: '#FFD452' }),
              mouseout: (e) => e.target.setStyle(styleRef.current(f)),
            });
            layer.bindTooltip(f.properties.nameVi, { sticky: true, className: 'country-tip', direction: 'top' });
          }}
        />
      )}
      {markers.map(({ place, kind, emoji, by }) => (
        <Marker
          key={kind + place.id}
          position={[place.lat, place.lng]}
          icon={pinIcon(kind, emoji)}
          eventHandlers={{ click: () => openPlace(place, { fly: false }) }}
          zIndexOffset={kind === 'visited' ? 500 : kind === 'trip' ? 400 : 0}
        >
          <Tooltip direction="top">{place.name}{by ? ` · ${by}` : ''}</Tooltip>
        </Marker>
      ))}
      <FlyController countries={countries} />
    </MapContainer>
  );
}
