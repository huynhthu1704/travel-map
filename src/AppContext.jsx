import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/store';
import { loadCountries } from './lib/countries';
import { translate as t } from './i18n';
import { pName } from './lib/lang';

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

  const value = {
    api, user, places, memories, publicMemories, trips, countries, activeTripId, setActiveTripId, tripStops,
    view, setView, returnView, setReturnView, selectedCountry, setSelectedCountry, selectedPlace, setSelectedPlace, flyTarget, setFlyTarget,
    modal, setModal, toast, notify, requireLogin, placeStatus, visitedCountries, setPlaceStatus, openCountry, openPlace,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
