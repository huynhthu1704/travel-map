import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/store';
import { loadCountries, bboxOf } from './lib/countries';
import { loadFamousLive } from './lib/famousLive';
import { famousIn } from './data/places';
import { translate as t } from './i18n';
import { pName, getLang } from './lib/lang';
import { reverseGeocode } from './lib/geo';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = đang kiểm tra
  const [places, setPlaces] = useState([]);
  const [memories, setMemories] = useState([]);
  const [publicMemories, setPublicMemories] = useState([]);
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [tripStops, setTripStops] = useState([]);
  const [countries, setCountries] = useState(null);

  const [view, setView] = useState('map');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  // Trang danh sách đã mở địa điểm (để có nút quay lại danh sách)
  const [returnView, setReturnView] = useState(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const [modal, setModal] = useState(null); // {type, ...props}
  const [liveFamous, setLiveFamous] = useState({}); // cc → [places] | 'loading'
  const [pickMode, setPickMode] = useState(null); // null | 'place' (thêm nhiều) | 'memory' (chọn 1 cho kỉ niệm)
  const [pickStatus, setPickStatus] = useState('visited');
  const [picked, setPicked] = useState([]); // địa điểm đã thêm trong lượt chọn này
  const [toast, setToast] = useState(null);
  const pendingAction = useRef(null);

  useEffect(() => api.onAuth(setUser), []);
  useEffect(() => api.watchPublicMemories(setPublicMemories), []);
  useEffect(() => {
    loadCountries().then(setCountries);
  }, []);

  useEffect(() => {
    if (!user) {
      setPlaces([]);
      setMemories([]);
      setTrips([]);
      return;
    }
    const u1 = api.watchPlaces(user.uid, setPlaces);
    const u2 = api.watchMyMemories(user.uid, setMemories);
    const u3 = api.watchTrips(user.uid, setTrips);
    if (pendingAction.current) {
      const fn = pendingAction.current;
      pendingAction.current = null;
      setTimeout(fn, 0);
    }
    return () => {
      u1();
      u2();
      u3();
    };
  }, [user]);

  useEffect(() => {
    if (!activeTripId || !user) {
      setTripStops([]);
      return;
    }
    return api.watchStops(activeTripId, setTripStops);
  }, [activeTripId, user]);

  // Tải thêm địa điểm nổi tiếng (Wikidata) khi mở một quốc gia
  const liveRef = useRef(liveFamous);
  liveRef.current = liveFamous;
  const ensureFamous = useCallback(
    (cc) => {
      if (!cc || !countries || liveRef.current[cc]) return;
      setLiveFamous((m) => ({ ...m, [cc]: 'loading' }));
      loadFamousLive(cc, bboxOf(cc)).then((list) => setLiveFamous((m) => ({ ...m, [cc]: list })));
    },
    [countries],
  );
  useEffect(() => ensureFamous(selectedCountry), [selectedCountry, ensureFamous]);
  const famousFor = useCallback(
    (cc) => {
      const live = liveFamous[cc];
      return [...famousIn(cc), ...(Array.isArray(live) ? live : [])];
    },
    [liveFamous],
  );
  const famousLoading = liveFamous[selectedCountry] === 'loading';
  const [famousLimit, setFamousLimit] = useState(15); // số địa điểm nổi tiếng đang hiện (nút "Xem thêm")
  useEffect(() => setFamousLimit(15), [selectedCountry]);
  const allLiveFamous = useMemo(() => Object.values(liveFamous).filter(Array.isArray).flat(), [liveFamous]);

  const notify = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind, id: Date.now() });
    setTimeout(() => setToast((t) => (t && Date.now() - t.id > 2500 ? null : t)), 2800);
  }, []);

  /** Chạy action nếu đã login, ngược lại mở hộp thoại login rồi chạy tiếp sau khi login. */
  const requireLogin = useCallback(
    (action, reason) => {
      if (user) return action();
      pendingAction.current = action;
      setModal({ type: 'login', reason });
    },
    [user],
  );

  // Link mời tham gia chuyến đi: #join=CODE
  useEffect(() => {
    const m = location.hash.match(/join=([A-Z0-9]+)/i);
    if (!m || user === undefined) return;
    const code = m[1];
    history.replaceState(null, '', location.pathname + location.search);
    requireLogin(async () => {
      try {
        const trip = await api.joinTrip(userRef.current, code);
        notify(t('toast.joined', { name: trip.name }));
        setView('trips');
      } catch (e) {
        notify(e.message, 'error');
      }
    }, t('reason.joinTrip'));
  }, [user === undefined]); // eslint-disable-line react-hooks/exhaustive-deps

  const userRef = useRef(user);
  userRef.current = user;

  const placeStatus = useMemo(() => Object.fromEntries(places.map((p) => [p.id, p.status])), [places]);
  const visitedCountries = useMemo(() => {
    const s = new Set();
    places.forEach((p) => p.status === 'visited' && p.country && s.add(p.country));
    memories.forEach((m) => m.place?.country && s.add(m.place.country));
    return s;
  }, [places, memories]);

  const setPlaceStatus = useCallback(
    (place, status, tripId) =>
      requireLogin(async () => {
        const u = userRef.current;
        const current = placeStatus[place.id];
        const next = current === status ? null : status;
        await api.setPlace(u, place, next, tripId);
        notify(
          next === 'visited' ? t('toast.visited', { name: pName(place) }) : next === 'wishlist' ? t('toast.wish', { name: pName(place) }) : t('toast.unmarked'),
        );
      }, t('reason.savePlace')),
    [requireLogin, placeStatus, notify],
  );

  const openCountry = useCallback(
    (cc) => {
      setView('map');
      setSelectedPlace(null);
      setSelectedCountry(cc);
      setFlyTarget({ country: cc, t: Date.now() });
    },
    [],
  );

  const openPlace = useCallback((place, { fly = true } = {}) => {
    setReturnView(viewRef.current !== 'map' ? viewRef.current : null);
    setView('map');
    setSelectedPlace(place);
    if (place.country) setSelectedCountry(place.country);
    if (fly) setFlyTarget({ lat: place.lat, lng: place.lng, zoom: 13, t: Date.now() });
  }, []);

  /** Tạo địa điểm tự do từ toạ độ (chọn trên bản đồ / link Google Maps), rồi lấy tên bằng reverse geocode. */
  const pinPlace = useCallback(
    async (lat, lng, { name = '', purpose = 'place', fly = false } = {}) => {
      const id = `pin-${lat.toFixed(5)}_${lng.toFixed(5)}`;
      const draft = { id, name: name || t('pick.loading'), city: '', country: '', lat, lng, emoji: '📍', custom: true };
      openPlace(draft, { fly });
      const geo = await reverseGeocode(lat, lng, getLang());
      const place = { ...draft, name: name || geo.name || t('pick.loading'), city: geo.city, country: geo.country };
      setSelectedPlace((cur) => (cur?.id === id ? place : cur));
      if (place.country) setSelectedCountry(place.country);
      if (purpose === 'memory') requireLogin(() => setModal({ type: 'memory', place }), t('reason.saveMemory'));
      return place;
    },
    [openPlace, requireLogin],
  );

  /** Mở bản đồ để chọn vị trí. purpose 'place' = thêm nhiều địa điểm; 'memory' = chọn 1 vị trí cho kỉ niệm. */
  const startPicking = useCallback(
    (purpose = 'place', status) => {
      const go = () => {
        setModal(null);
        setView('map');
        setSelectedPlace(null);
        if (status) setPickStatus(status);
        if (purpose === 'place') setPicked([]);
        setPickMode(purpose);
      };
      if (purpose === 'place') requireLogin(go, t('reason.savePlace'));
      else go();
    },
    [requireLogin],
  );

  /** Ở chế độ thêm nhiều: mỗi lần chạm bản đồ = lưu 1 địa điểm với trạng thái đang chọn */
  const addPickedAt = useCallback(
    async (lat, lng) => {
      const u = userRef.current;
      if (!u) return;
      const id = `pin-${lat.toFixed(5)}_${lng.toFixed(5)}`;
      const status = pickStatusRef.current;
      const draft = { id, name: t('pick.loading'), city: '', country: '', lat, lng, emoji: '📍', custom: true };
      setPicked((list) => [...list, { place: draft, status, loading: true }]);
      const geo = await reverseGeocode(lat, lng, getLang());
      const place = { ...draft, name: geo.name || t('pick.loading'), city: geo.city, country: geo.country };
      await api.setPlace(u, place, status);
      setPicked((list) => list.map((x) => (x.place.id === id ? { place, status, loading: false } : x)));
    },
    [],
  );
  const pickStatusRef = useRef(pickStatus);
  pickStatusRef.current = pickStatus;
  const removePicked = useCallback(async (place) => {
    setPicked((list) => list.filter((x) => x.place.id !== place.id));
    await api.setPlace(userRef.current, place, null);
  }, []);
  const renamePicked = useCallback(async (place, name, status) => {
    const next = { ...place, name };
    setPicked((list) => list.map((x) => (x.place.id === place.id ? { ...x, place: next } : x)));
    await api.setPlace(userRef.current, next, status);
  }, []);
  const finishPicking = useCallback(() => {
    setPickMode(null);
    setPicked((list) => {
      if (list.length) notify(t('pick.done', { n: list.length }));
      return [];
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    pickMode, setPickMode, pinPlace, startPicking, pickStatus, setPickStatus, picked, addPickedAt, removePicked, renamePicked, finishPicking, famousFor, ensureFamous, famousLoading, allLiveFamous, famousLimit, setFamousLimit,
    api, user, places, memories, publicMemories, trips, countries, activeTripId, setActiveTripId, tripStops,
    view, setView, returnView, setReturnView, selectedCountry, setSelectedCountry, selectedPlace, setSelectedPlace, flyTarget, setFlyTarget,
    modal, setModal, toast, notify, requireLogin, placeStatus, visitedCountries, setPlaceStatus, openCountry, openPlace,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
