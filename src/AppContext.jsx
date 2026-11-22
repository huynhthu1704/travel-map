import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/store';
import { socialApi, nameSearchFields } from './lib/social';
import { loadCountries, bboxOf, countryAt } from './lib/countries';
import { parseRoute, buildRoute } from './lib/route';
import { loadFamousLive } from './lib/famousLive';
import { famousIn } from './data/places';
import { adminApi, isSuperUid, setAdminActor, DEFAULT_SETTINGS } from './lib/adminStore';
import { permsOf } from './lib/roles';
import { normalize } from './lib/geo';
import { COORD_FIXES, fixPlace, fixMemory } from './lib/fixes';
import { translate as t } from './i18n';
import { pName, getLang } from './lib/lang';
const pCityOf = (p) => (p?.city || '').trim();
import { reverseGeocode, googleMapsUrl } from './lib/geo';
import { LEGAL_VERSION, CONSENT_KEY } from './data/legal';
import { flagAllows } from './data/flags';

const isDesktop = () =>
  !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)) && !window.matchMedia('(pointer: coarse)').matches;

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined); // undefined = đang kiểm tra
  const [displayName, setDisplayName] = useState(null); // tên người dùng tự đặt (thay cho tên Google)
  const [profilePhoto, setProfilePhoto] = useState(null); // ảnh đại diện tự chọn (thay cho ảnh Google)
  const user = useMemo(
    () =>
      authUser
        ? { ...authUser, googleName: authUser.name, googlePhoto: authUser.photo, name: displayName || authUser.name, photo: profilePhoto || authUser.photo }
        : authUser,
    [authUser, displayName, profilePhoto],
  );
  const [places, setPlaces] = useState([]);
  const [memories, setMemories] = useState([]);
  const [publicMemories, setPublicMemories] = useState([]);
  const [trips, setTrips] = useState([]);
  const codeChecked = useRef(new Set());
  const [myInvites, setMyInvites] = useState([]); // lời mời vào chuyến đi đang chờ mình trả lời
  // Trang đang mở lấy từ đường dẫn, để tải lại trang vẫn ở đúng chỗ
  const [initRoute] = useState(() => parseRoute(location.hash));
  const [activeTripId, setActiveTripId] = useState(initRoute.trip);
  const [openTripId, setOpenTripId] = useState(initRoute.tripDetail);
  const [tripTab, setTripTab] = useState(initRoute.tripTab); // tab trong trang chuyến đi: plan | checklist | journey
  const [tripPlan, setTripPlan] = useState([]); // kế hoạch của chuyến đang hiện trên bản đồ
  const [tripStops, setTripStops] = useState([]);
  const [countries, setCountries] = useState(null);
  const countriesRef = useRef(null);
  countriesRef.current = countries;
  const [loaded, setLoaded] = useState({ public: false, mine: false, trips: false });
  const markLoaded = (k) => setLoaded((l) => (l[k] ? l : { ...l, [k]: true }));

  const [view, setView] = useState(initRoute.view);
  // REQ-011: bản chi tiết (50m, ~230 KB nén) chỉ tải khi mở trang Bản đồ lần đầu, lúc trình duyệt rảnh
  const detailRequested = useRef(false);
  useEffect(() => {
    if (view !== 'map' || detailRequested.current) return;
    detailRequested.current = true;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    idle(() => loadCountries('110m').finally(() => loadCountries('50m').then((fc) => setCountries(fc))));
  }, [view]);
  const [selectedCountry, setSelectedCountry] = useState(initRoute.country);
  const [selectedPlace, setSelectedPlace] = useState(initRoute.place);
  const [profileUid, setProfileUid] = useState(initRoute.profile); // hồ sơ đang xem (#/u/<uid>)
  const [profileSub, setProfileSub] = useState(initRoute.profileSub);
  const [tipPost, setTipPost] = useState(initRoute.tipPost); // bài kinh nghiệm đang mở
  const [guideCc, setGuideCc] = useState(initRoute.guideCc); // cẩm nang đang mở (#/guide/<cc>)
  const [flyTarget, setFlyTarget] = useState(null);
  // Trang danh sách đã mở địa điểm (để có nút quay lại danh sách)
  const [returnView, setReturnView] = useState(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const [modal, setModalState] = useState(null); // {type, ...props}
  // Chỉ đường trên máy tính: mở thẳng Google Maps (không hỏi Apple Maps / Google Maps)
  const setModal = useCallback((m) => {
    if (m?.type === 'directions' && m.place && isDesktop()) {
      window.open(googleMapsUrl(m.place), '_blank', 'noopener');
      return;
    }
    setModalState(m);
  }, []);
  const [liveFamous, setLiveFamous] = useState({}); // cc → [places] | 'loading'
  // Quốc gia mặc định để hiện danh lam thắng cảnh (mặc định Việt Nam, người dùng đổi được)
  // --- Quản trị: hồ sơ / phân quyền, cài đặt trang, chỉnh sửa & thêm địa điểm nổi tiếng ---
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [overrides, setOverrides] = useState({});
  const [customPlaces, setCustomPlaces] = useState([]);
  useEffect(() => adminApi.watchSettings(setSettings), []);
  useEffect(() => adminApi.watchOverrides(setOverrides), []);
  const [guideOverrides, setGuideOverrides] = useState({});
  useEffect(() => adminApi.watchGuideOverrides(setGuideOverrides), []);
  const [guideLinks, setGuideLinks] = useState([]);
  useEffect(() => adminApi.watchGuideLinks(setGuideLinks), []);
  useEffect(() => adminApi.watchCustomPlaces(setCustomPlaces), []);

  const [homeChoice, setHomeCountryState] = useState(() => {
    try {
      return localStorage.getItem('travel-map-home') || null;
    } catch {
      return null;
    }
  });
  const homeCountry = homeChoice || settings.homeCountry || 'VN';
  const setHomeCountry = useCallback((cc) => {
    setHomeCountryState(cc);
    try {
      localStorage.setItem('travel-map-home', cc);
    } catch {
      /* ignore */
    }
  }, []);
  const [pickMode, setPickMode] = useState(null); // null | 'place' (thêm nhiều) | 'memory' (chọn 1 cho kỉ niệm)
  const [pickStatus, setPickStatus] = useState('visited');
  const [picked, setPicked] = useState([]); // địa điểm đã thêm trong lượt chọn này
  const [pickDate, setPickDate] = useState('');
  const pickDateRef = useRef(pickDate);
  pickDateRef.current = pickDate;
  const [pickOccasion, setPickOccasion] = useState('');
  const pickOccasionRef = useRef(pickOccasion);
  pickOccasionRef.current = pickOccasion;
  const [toast, setToast] = useState(null);
  const pendingAction = useRef(null);

  useEffect(() => api.onAuth(setAuthUser), []);
  // Hồ sơ người dùng: tên hiển thị tự đặt + quyền quản trị (tạo / cập nhật khi đăng nhập)
  useEffect(() => {
    if (!authUser) {
      setProfile(null);
      setProfilePhoto(null);
      setDisplayName(null);
      return;
    }
    adminApi.upsertProfile(authUser).catch(() => {});
    return adminApi.watchProfile(authUser.uid, (p) => {
      setProfile(p);
      setDisplayName(p?.displayName || null);
      setProfilePhoto(p?.photo || null);
    });
  }, [authUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  // Đồng ý Điều khoản & Chính sách: lưu khi đăng nhập lần đầu; phiên bản mới → hỏi lại
  useEffect(() => {
    if (!authUser || !profile) return;
    if (profile.consentVersion === LEGAL_VERSION) return;
    if (sessionStorage.getItem(CONSENT_KEY) === LEGAL_VERSION) {
      sessionStorage.removeItem(CONSENT_KEY);
      adminApi.setConsent?.(authUser.uid, LEGAL_VERSION).catch(() => {});
    } else setModalState((m) => (m?.type === 'login' || !m ? { type: 'consent' } : m));
  }, [authUser?.uid, profile?.consentVersion, !!profile]); // eslint-disable-line react-hooks/exhaustive-deps
  const isSuper = !!user && isSuperUid(user.uid);
  const role = isSuper ? 'admin' : profile?.role || 'user';
  const isAdmin = role === 'admin';
  const isStaff = role !== 'user';
  // Quyền quản trị theo vai trò (Quản trị → Vai trò & quyền)
  const perms = useMemo(() => new Set(permsOf(role, settings)), [role, settings]);
  const hasPerm = useCallback((p) => isAdmin || perms.has(p), [isAdmin, perms]);
  const banned = !isSuper && !!profile?.banned;
  const can = useCallback((key) => flagAllows(key, settings, user, isSuper), [settings, user, isSuper]); // feature flags
  setAdminActor(isStaff ? user : null); // người thực hiện thao tác quản trị — ghi vào nhật ký
  useEffect(() => {
    // Bản đồ quốc gia nhẹ (~36 KB nén) để tìm kiếm / tô màu nhanh
    let alive = true;
    loadCountries('110m').then((fc) => alive && setCountries((cur) => cur || fc));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setPlaces([]);
      setMemories([]);
      setTrips([]);
      return;
    }
    const u1 = api.watchPlaces(user.uid, (list) => setPlaces(list.map(fixPlace)));
    const u2 = api.watchMyMemories(user.uid, (list) => {
      setMemories(list.map(fixMemory));
      markLoaded('mine');
    });
    const u3 = api.watchTrips(user.uid, (list) => {
      setTrips(list);
      markLoaded('trips');
      // chuyến mình làm chủ: đảm bảo mã mời có trong bảng tra mã
      list.filter((tr) => tr.ownerId === user.uid && !codeChecked.current.has(tr.inviteCode)).forEach((tr) => {
        codeChecked.current.add(tr.inviteCode);
        api.ensureInviteCode?.(user, tr);
      });
    });
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
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeTripId || !user) {
      setTripStops([]);
      return;
    }
    return api.watchStops(activeTripId, setTripStops);
  }, [activeTripId, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!activeTripId || !user) return setTripPlan([]);
    return api.watchPlan(activeTripId, setTripPlan);
  }, [activeTripId, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tải thêm địa điểm nổi tiếng (Wikidata) khi mở một quốc gia
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const liveRef = useRef(liveFamous);
  liveRef.current = liveFamous;
  const ensureFamous = useCallback(
    (cc) => {
      if (!cc || !countries || liveRef.current[cc] || !flagAllows('wikidata', settingsRef.current, userRef.current, isSuperUid(userRef.current?.uid))) return;
      setLiveFamous((m) => ({ ...m, [cc]: 'loading' }));
      loadFamousLive(cc, bboxOf(cc)).then((list) => setLiveFamous((m) => ({ ...m, [cc]: list })));
    },
    [countries],
  );
  useEffect(() => ensureFamous(selectedCountry), [selectedCountry, ensureFamous]);
  useEffect(() => ensureFamous(homeCountry), [homeCountry, ensureFamous]);
  // Lần đầu mở web: đưa bản đồ tới quốc gia mặc định để thấy danh lam thắng cảnh
  const didInitialFly = useRef(false);
  useEffect(() => {
    if (!countries || didInitialFly.current) return;
    didInitialFly.current = true;
    const r = initRoute;
    if (r.place) setFlyTarget({ lat: r.place.lat, lng: r.place.lng, zoom: 13, t: Date.now() });
    else if (r.country) setFlyTarget({ country: r.country, t: Date.now() });
    else if (!r.trip) setFlyTarget({ country: homeCountry, t: Date.now() });
  }, [countries]); // eslint-disable-line react-hooks/exhaustive-deps
  /** Áp chỉnh sửa của quản trị viên (ẩn / đổi tên / mô tả / ảnh / toạ độ) lên một địa điểm */
  const applyOverride = useCallback(
    (p) => {
      if (!p) return p;
      const o = { ...(COORD_FIXES[p.id] || {}), ...(overrides[p.id] || {}) };
      if (!Object.keys(o).length) return p;
      if (o.lat != null && o.lng != null && o.lat !== '' && o.lng !== '') p = { ...p, lat: Number(o.lat), lng: Number(o.lng) };
      if (!overrides[p.id]) return p;
      const en = { ...(p.i18n?.en || {}), ...(o.nameEn ? { name: o.nameEn } : {}), ...(o.descEn ? { desc: o.descEn } : {}) };
      return { ...p, name: o.nameVi || p.name, desc: o.descVi || p.desc, image: o.image || p.image, i18n: { ...(p.i18n || {}), en }, hidden: !!o.hidden };
    },
    [overrides],
  );
  /** Địa điểm nổi tiếng của 1 quốc gia: do quản trị viên thêm + chọn sẵn + Wikidata, đã áp chỉnh sửa */
  const famousFor = useCallback(
    (cc, { includeHidden = false } = {}) => {
      const live = liveFamous[cc];
      const custom = customPlaces.filter((p) => p.country === cc);
      const seen = new Set(custom.map((p) => normalize(p.name)));
      const list = [...custom, ...famousIn(cc), ...(Array.isArray(live) ? live : [])]
        .filter((p, i) => i < custom.length || !seen.has(normalize(p.name)))
        .map(applyOverride);
      return includeHidden ? list : list.filter((p) => !p.hidden);
    },
    [liveFamous, customPlaces, applyOverride],
  );
  const famousLoading = liveFamous[selectedCountry] === 'loading';
  const homeLoading = liveFamous[homeCountry] === 'loading';
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
      if (user) {
        if (banned) return notify(t('admin.bannedNotice'), 'error');
        return action();
      }
      pendingAction.current = action;
      setModal({ type: 'login', reason });
    },
    [user, banned, notify],
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
  const placeById = useMemo(() => Object.fromEntries(places.map((p) => [p.id, p])), [places]);
  /** Lưu "đã đến" kèm ngày / dịp. patch: { visitedAt?, occasion? } — phần không truyền thì giữ nguyên */
  const saveVisited = useCallback(
    async (place, patch = {}, tripId) => {
      const prev = placeById[place.id] || {};
      const visitedAt = 'visitedAt' in patch ? patch.visitedAt : prev.visitedAt;
      const occasion = 'occasion' in patch ? patch.occasion : prev.occasion;
      await api.setPlace(userRef.current, { ...prev, ...place }, 'visited', tripId ?? prev.tripId, visitedAt, occasion);
    },
    [placeById],
  );
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
        // Bỏ "đã đến" → hỏi xác nhận trước khi xoá
        if (current === 'visited' && next === null) return setModal({ type: 'confirmRemove', place: placeById[place.id] || place });
        // Đánh dấu "đã đến" = check-in: chọn ngày, dịp, ghi chú, ảnh (tuỳ chọn)
        if (next === 'visited') return setModal({ type: 'checkin', place, tripId });
        await api.setPlace(u, place, next, tripId);
        notify(
          next === 'visited' ? t('toast.visited', { name: pName(place) }) : next === 'wishlist' ? t('toast.wish', { name: pName(place) }) : t('toast.unmarked'),
        );
      }, t('reason.savePlace')),
    [requireLogin, placeStatus, notify, placeById],
  );

  /** Xoá địa điểm khỏi danh sách Đã đến / Muốn đi (có hỏi xác nhận) */
  const removePlace = useCallback((place) => setModal({ type: 'confirmRemove', place }), []);
  /**
   * Xoá 1 lần check-in (kỉ niệm) và đồng bộ những chỗ khác:
   * - không còn lần check-in nào ở địa điểm đó → bỏ đánh dấu "đã đến" (check-in đã tự đánh dấu khi lưu)
   * - còn lần khác → ngày đến = lần check-in gần nhất còn lại
   * - điểm dừng trong chuyến đi tạo từ lần check-in này cũng bị xoá
   */
  const memoriesRef = useRef([]);
  const placesRef = useRef([]);
  memoriesRef.current = memories;
  placesRef.current = places;
  const deleteCheckin = useCallback(async (mem) => {
    const u = userRef.current;
    await api.deleteMemory(mem);
    if (!u || !mem.place?.id) return;
    await api.deleteStopsOfMemory?.(u, mem).catch(() => {});
    const rest = memoriesRef.current.filter((m) => m.id !== mem.id && m.place?.id === mem.place.id);
    const saved = placesRef.current.find((p) => p.id === mem.place.id);
    if (!saved || saved.status !== 'visited') return;
    if (!rest.length) await api.setPlace(u, saved, null);
    else {
      const latest = rest.map((m) => m.date).filter(Boolean).sort().pop() || null;
      if (latest !== saved.visitedAt) await api.setVisitedAt(u, saved.id, latest);
    }
  }, []);
  const confirmRemovePlace = useCallback(
    async (place) => {
      await api.setPlace(userRef.current, place, null);
      notify(t('remove.done', { name: pName(place) }));
    },
    [notify],
  );

  // ---- Đồng bộ trang đang xem với đường dẫn (#/...) ----
  const routeReplace = useRef(true); // lần đầu & khi bấm Back/Forward: chỉ thay, không thêm lịch sử
  useEffect(() => {
    if (/join=/.test(location.hash)) return;
    const h = buildRoute({ view, country: selectedCountry, place: selectedPlace, trip: activeTripId, tripDetail: openTripId, tripTab, profile: profileUid, profileSub, tipPost, guideCc });
    const replace = routeReplace.current;
    routeReplace.current = false;
    if (h === location.hash) return;
    const samePath = h.split('?')[0] === location.hash.split('?')[0];
    const url = location.pathname + location.search + h;
    if (replace || samePath) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
  }, [view, selectedCountry, selectedPlace, activeTripId, openTripId, tripTab, profileUid, profileSub, tipPost, guideCc]);
  useEffect(() => {
    const onPop = () => {
      const r = parseRoute(location.hash);
      routeReplace.current = true;
      setView(r.view);
      setSelectedCountry(r.country);
      setSelectedPlace(r.place);
      setActiveTripId(r.trip);
      setOpenTripId(r.tripDetail);
      setTripTab(r.tripTab);
      setProfileUid(r.profile);
      setProfileSub(r.profileSub);
      setTipPost(r.tipPost);
      setGuideCc(r.guideCc);
      if (r.view === 'map') {
        if (r.place) setFlyTarget({ lat: r.place.lat, lng: r.place.lng, zoom: 13, t: Date.now() });
        else if (r.country) setFlyTarget({ country: r.country, t: Date.now() });
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Địa điểm mở từ đường dẫn chỉ có thông tin cơ bản: khi dữ liệu tải xong thì thay bằng bản đầy đủ (ảnh, mô tả…)
  useEffect(() => {
    const p = selectedPlace;
    if (!p?.restored) return;
    const found =
      placeById[p.id] ||
      memories.find((m) => m.place?.id === p.id)?.place ||
      (p.country ? famousFor(p.country).find((x) => x.id === p.id) : null);
    if (found) setSelectedPlace(found);
  }, [selectedPlace, placeById, memories, famousFor]);

  // Khi bật 1 chuyến đi trên bản đồ: thu phóng vừa các điểm dừng của chuyến đó
  const fittedTrip = useRef(initRoute.place ? initRoute.trip : null);
  const [routeNonce, setRouteNonce] = useState(0);
  useEffect(() => {
    if (!activeTripId) return void (fittedTrip.current = null);
    if (fittedTrip.current === activeTripId) return;
    const stops = [...tripStops, ...tripPlan].filter((s) => s.tripId === activeTripId && s.place);
    if (!stops.length) return;
    fittedTrip.current = activeTripId;
    const la = stops.map((s) => s.place.lat);
    const ln = stops.map((s) => s.place.lng);
    const pad = 0.05;
    setFlyTarget({ bbox: [Math.min(...la) - pad, Math.max(...la) + pad, Math.min(...ln) - pad, Math.max(...ln) + pad], t: Date.now() });
  }, [activeTripId, tripStops, tripPlan, routeNonce]);
  /** Bấm logo: về trang chủ ở chế độ mặc định (bản đồ thế giới, quốc gia mặc định, không xem chuyến / địa điểm nào) */
  const goHome = useCallback(() => {
    setPickMode(null);
    setSelectedPlace(null);
    setSelectedCountry(null);
    setActiveTripId(null);
    setOpenTripId(null);
    setReturnView(null);
    setModal(null);
    setView('map');
    setFlyTarget({ country: homeCountry, t: Date.now() });
  }, [homeCountry]); // eslint-disable-line react-hooks/exhaustive-deps
  // Đăng xuất (từ bất kỳ đâu) → về trang chủ bản đồ, đóng mọi trang / hộp thoại đang mở
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (user) wasSignedIn.current = true;
    else if (user === null && wasSignedIn.current) {
      wasSignedIn.current = false;
      goHome();
      window.scrollTo?.(0, 0);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  /** Mở bản đồ ở chế độ lộ trình chuyến đi: bỏ địa điểm đang mở, thu phóng vừa toàn bộ lộ trình */
  const showTripOnMap = useCallback((id) => {
    fittedTrip.current = null;
    setSelectedPlace(null);
    setSelectedCountry(null);
    setActiveTripId(id);
    setRouteNonce((x) => x + 1);
    setView('map');
  }, []);

  // Kinh nghiệm du lịch theo quốc gia (#/tips/<cc>?post=<id>)
  const openTips = useCallback((cc) => {
    setSelectedPlace(null);
    setSelectedCountry(cc);
    setTipPost(null);
    window.scrollTo?.(0, 0);
    setView('tips');
  }, []);
  // focus: 'famous' → bảng quốc gia cuộn tới mục Địa điểm nổi tiếng (mở từ Cẩm nang)
  const [countryFocus, setCountryFocus] = useState(null);
  const openCountry = useCallback(
    (cc, focus = null) => {
      setCountryFocus(focus ? { cc, focus, t: Date.now() } : null);
      setView('map');
      setSelectedPlace(null);
      setSelectedCountry(cc);
      setFlyTarget({ country: cc, t: Date.now() });
    },
    [],
  );

  // Mở chi tiết từ danh sách bên trái → nút quay lại trở về đúng danh sách đó
  const [placeOrigin, setPlaceOrigin] = useState(null);
  const openPlace = useCallback((place, { fly = true, from = null } = {}) => {
    setReturnView(viewRef.current !== 'map' ? viewRef.current : null);
    setView('map');
    setPlaceOrigin(from);
    setSelectedPlace(place);
    if (place.country && from !== 'list') setSelectedCountry(place.country);
    if (fly) setFlyTarget({ lat: place.lat, lng: place.lng, zoom: 13, t: Date.now() });
  }, []);

  /** Tạo địa điểm tự do từ toạ độ (chọn trên bản đồ / link Google Maps), rồi lấy tên bằng reverse geocode. */
  const pinPlace = useCallback(
    async (lat, lng, { name = '', purpose = 'place', fly = false } = {}) => {
      const id = `pin-${lat.toFixed(5)}_${lng.toFixed(5)}`;
      const draft = { id, name: name || t('pick.loading'), city: '', country: '', lat, lng, emoji: '📍', custom: true };
      if (purpose !== 'memory') openPlace(draft, { fly });
      const geo = await reverseGeocode(lat, lng, getLang());
      const country = geo.country || countryAt(countriesRef.current, lat, lng);
      // Không cho chọn điểm không thuộc quốc gia nào (giữa biển…)
      if (!country) {
        notify(t('pick.noCountry'), 'error');
        setSelectedPlace((cur) => (cur?.id === id ? null : cur));
        if (purpose === 'memory') setPickMode('memory');
        return null;
      }
      // Kỉ niệm: chưa lấy được tên thì để trống cho người dùng tự đặt
      const place = { ...draft, name: name || geo.name || (purpose === 'memory' ? '' : t('pick.loading')), city: geo.city, country, needsName: !name && !geo.name };
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
      const country = geo.country || countryAt(countriesRef.current, lat, lng);
      if (!country) {
        setPicked((list) => list.filter((x) => x.place.id !== id));
        notify(t('pick.noCountry'), 'error');
        return;
      }
      const place = { ...draft, name: geo.name || t('pick.loading'), city: geo.city, country };
      const date = status === 'visited' ? pickDateRef.current || null : null;
      const occasion = status === 'visited' ? pickOccasionRef.current.trim() : '';
      await api.setPlace(u, place, status, null, date, occasion);
      setPicked((list) => list.map((x) => (x.place.id === id ? { place, status, date, occasion, loading: false } : x)));
    },
    [],
  );
  const pickStatusRef = useRef(pickStatus);
  pickStatusRef.current = pickStatus;
  const removePicked = useCallback(async (place) => {
    setPicked((list) => list.filter((x) => x.place.id !== place.id));
    await api.setPlace(userRef.current, place, null);
  }, []);
  const renamePicked = useCallback(async (place, name, status, date, occasion) => {
    const next = { ...place, name };
    setPicked((list) => list.map((x) => (x.place.id === place.id ? { ...x, place: next } : x)));
    await api.setPlace(userRef.current, next, status, null, date, occasion);
  }, []);
  const finishPicking = useCallback(() => {
    setPickMode(null);
    setPicked((list) => {
      if (list.length) notify(t('pick.done', { n: list.length }));
      return [];
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Kỉ niệm công khai (kèm ảnh) khá nặng → chỉ tải khi cần: trang Khám phá, xem một quốc gia / địa điểm
  const [needPublic, setNeedPublic] = useState(false);
  useEffect(() => {
    if (!needPublic && (view === 'explore' || selectedPlace || selectedCountry)) setNeedPublic(true);
  }, [view, selectedPlace, selectedCountry, needPublic]);
  useEffect(() => {
    if (!needPublic) return undefined;
    return api.watchPublicMemories((list) => {
      setPublicMemories(list.map(fixMemory));
      markLoaded('public');
    });
  }, [needPublic]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kỉ niệm cũ lưu mọi ảnh thu nhỏ trong document → chuyển sang dạng nhẹ (chạy nền 1 lần mỗi phiên)
  const slimmed = useRef(false);
  useEffect(() => {
    if (!user || !loaded.mine || slimmed.current) return undefined;
    if (!memories.some((m) => m.uid === user.uid && !m.thumbsMoved && (m.photos?.length || 0) > 1)) return undefined;
    slimmed.current = true;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 3000));
    idle(() => api.slimMemories(user, memories));
    return undefined;
  }, [user?.uid, loaded.mine, memories]); // eslint-disable-line react-hooks/exhaustive-deps

  // Thống kê hoạt động của chính người dùng → lưu vào hồ sơ để trang Thống kê (quản trị) tổng hợp,
  // không cần đọc dữ liệu riêng tư của từng người. Chỉ ghi khi số liệu thay đổi.
  const statsRef = useRef('');
  useEffect(() => {
    if (!user || !loaded.mine || !loaded.trips) return undefined;
    const ts = (v) => (v?.toMillis ? v.toMillis() : typeof v === 'number' ? v : v ? Date.parse(v) || 0 : 0);
    const visited = places.filter((p) => p.status === 'visited');
    const countriesSet = new Set([...visited.map((p) => p.country), ...memories.map((m) => m.place?.country)].filter(Boolean));
    const created = memories.map((m) => ts(m.createdAt)).filter(Boolean);
    const stats = {
      visited: visited.length,
      wishlist: places.filter((p) => p.status === 'wishlist').length,
      countries: [...countriesSet].sort(),
      memories: memories.length,
      publicMemories: memories.filter((m) => m.visibility === 'public').length,
      photos: memories.reduce((n, m) => n + (m.photoCount || m.photos?.length || 0), 0),
      trips: trips.length,
      tripsOwned: trips.filter((tr) => tr.ownerId === user.uid).length,
      groupTrips: trips.filter((tr) => (tr.memberIds?.length || 0) > 1).length,
      firstCheckinAt: created.length ? Math.min(...created) : null,
      lastActionAt: Math.max(0, ...created, ...places.map((p) => ts(p.updatedAt))) || null,
    };
    const key = JSON.stringify(stats);
    if (key === statsRef.current) return undefined;
    const tm = setTimeout(() => {
      statsRef.current = key;
      adminApi.saveStats(user.uid, stats).catch(() => {});
    }, 4000);
    return () => clearTimeout(tm);
  }, [user?.uid, places, memories, trips, loaded.mine, loaded.trips]); // eslint-disable-line react-hooks/exhaustive-deps

  // ================= Mạng xã hội =================
  const openProfile = useCallback((uid, sub = null) => {
    if (!uid) return;
    setProfileUid(uid);
    setProfileSub(sub);
    window.scrollTo?.(0, 0);
    setView('profile');
    setModal(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hồ sơ công khai của chính mình: tổng quốc gia / thành phố, số check-in công khai (tự cập nhật khi dữ liệu đổi)
  const [myPublic, setMyPublic] = useState(undefined); // undefined = đang tải
  useEffect(() => {
    setMyPublic(undefined);
    return user ? socialApi.watchProfile(user.uid, setMyPublic) : setMyPublic(null);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const pubRef = useRef('');
  useEffect(() => {
    if (!user || !loaded.mine || myPublic === undefined) return undefined;
    const visited = places.filter((p) => p.status === 'visited');
    const all = [...visited, ...memories.map((m) => m.place).filter(Boolean)];
    const countries = [...new Set(all.map((p) => p.country).filter(Boolean))].sort();
    const cityMap = new Map();
    all.forEach((p) => {
      const name = pCityOf(p);
      if (name && p.country) cityMap.set(`${p.country}|${name}`, { name, cc: p.country });
    });
    const basic = { name: user.name || '', ...nameSearchFields(user.name), photo: user.photo || '' };
    const priv = !!myPublic?.privateProfile;
    const data = {
      countries,
      cities: [...cityMap.values()].sort((a, b) => a.cc.localeCompare(b.cc) || a.name.localeCompare(b.name)),
      visited: new Set(all.map((p) => p.id)).size,
      publicCheckins: memories.filter((m) => m.visibility === 'public').length,
    };
    // Bảng tin cho bạn bè theo dõi chéo: check-in công khai + lần đầu tới 1 quốc gia / thành phố
    const ts = (v) => (v?.toMillis ? v.toMillis() : typeof v === 'number' ? v : v ? Date.parse(v) || 0 : 0);
    const dated = memories.map((m) => ({ m, at: ts(m.date) || ts(m.createdAt) })).filter((x) => x.m.place);
    const firstBy = (key) => {
      const out = new Map();
      [...dated].sort((a, b) => a.at - b.at).forEach(({ m, at }) => {
        const k = key(m.place);
        if (k && !out.has(k)) out.set(k, { place: m.place, at });
      });
      return [...out.values()];
    };
    const items = [
      ...dated.filter((x) => x.m.visibility === 'public').map(({ m, at }) => ({ type: 'checkin', name: m.place.name, city: pCityOf(m.place), cc: m.place.country || '', at, memoryId: m.id, public: true })),
      ...firstBy((p) => p.country).map(({ place, at }) => ({ type: 'country', name: place.name, city: pCityOf(place), cc: place.country, at })),
      ...firstBy((p) => (pCityOf(p) ? `${p.country}|${pCityOf(p)}` : '')).map(({ place, at }) => ({ type: 'city', name: place.name, city: pCityOf(place), cc: place.country || '', at })),
    ]
      .filter((x) => x.at)
      .sort((a, b) => b.at - a.at)
      .slice(0, 40);
    const key = JSON.stringify([basic, data, items, priv]);
    if (key === pubRef.current) return undefined;
    const tm = setTimeout(() => {
      pubRef.current = key;
      socialApi.saveProfile(user.uid, basic).catch(() => {});
      socialApi.saveStats(user.uid, data, priv).catch(() => {});
      socialApi.saveFeed(user.uid, items).catch(() => {});
    }, 3000);
    return () => clearTimeout(tm);
  }, [user?.uid, user?.name, user?.photo, places, memories, loaded.mine, !!myPublic?.privateProfile, myPublic === undefined]); // eslint-disable-line react-hooks/exhaustive-deps

  // Theo dõi: người mình theo dõi / người theo dõi mình → bạn bè = theo dõi chéo
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  useEffect(() => (user ? socialApi.watchFollowing(user.uid, setFollowing) : setFollowing([])), [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => (user ? socialApi.watchFollowers(user.uid, setFollowers) : setFollowers([])), [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const followingIds = useMemo(() => new Set(following.map((f) => f.to)), [following]);
  const followerIds = useMemo(() => new Set(followers.map((f) => f.from)), [followers]);
  const friendIds = useMemo(() => [...followingIds].filter((id) => followerIds.has(id)), [followingIds, followerIds]);
  const toggleFollow = useCallback(
    (uid, name) =>
      requireLogin(async () => {
        const me = userRef.current;
        if (!me || uid === me.uid) return;
        if (followingIds.has(uid)) {
          await socialApi.unfollow(me.uid, uid);
          notify(t('social.unfollowed', { name: name || '' }));
        } else {
          await socialApi.follow(me, uid);
          socialApi.notify({ to: uid, type: 'follow', from: me.uid, fromName: me.name || '', fromPhoto: me.photo || '' }).catch(() => {});
          notify(t('social.followed', { name: name || '' }));
        }
      }, t('social.loginFollow')),
    [followingIds, requireLogin, notify],
  );

  // Thông báo: của riêng mình + thông báo chung (tính năng mới…)
  const [notifications, setNotifications] = useState([]);
  useEffect(() => (user ? socialApi.watchNotifications(user.uid, setNotifications, role) : setNotifications([])), [user?.uid, role]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => (user && api.watchMyInvites ? api.watchMyInvites(user.uid, setMyInvites) : setMyInvites([])), [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const annRead = profile?.annRead;
  const notes = useMemo(() => notifications.map((n) => (n.broadcast && annRead ? { ...n, read: annRead.includes(n.id) || n.read } : n)), [notifications, annRead]);
  const unread = notes.filter((n) => !n.read).length;

  const value = {
    profile, role, isAdmin, isStaff, isSuper, banned, hasPerm,
    profileUid, setProfileUid, profileSub, setProfileSub, openProfile, myPublic, following, followers, followingIds, followerIds, friendIds, toggleFollow, notes, unread, socialApi, settings, overrides, guideOverrides, guideLinks, customPlaces, applyOverride, adminApi,
    reportMemory: (m, reason, note) => adminApi.reportMemory(userRef.current, m, reason, note),
    loaded, placeById, saveVisited, removePlace, confirmRemovePlace, pickMode, setPickMode, pinPlace, startPicking, pickStatus, setPickStatus, pickDate, setPickDate, pickOccasion, setPickOccasion, picked, addPickedAt, removePicked, renamePicked, finishPicking, famousFor, ensureFamous, famousLoading, homeCountry, setHomeCountry, homeLoading, allLiveFamous, famousLimit, setFamousLimit,
    api, user, places, memories, publicMemories, loadPublic: () => setNeedPublic(true), trips, countries, activeTripId, setActiveTripId, tripStops, openTripId, setOpenTripId, showTripOnMap, goHome, tripTab, setTripTab, tripPlan,
    placeOrigin, setPlaceOrigin,
    view, setView, returnView, setReturnView, selectedCountry, setSelectedCountry, selectedPlace, setSelectedPlace, flyTarget, setFlyTarget,
    modal, setModal, toast, notify, deleteCheckin, myInvites, can, openTips, tipPost, setTipPost, guideCc, setGuideCc, requireLogin, placeStatus, visitedCountries, setPlaceStatus, openCountry, countryFocus, setCountryFocus, openPlace,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
