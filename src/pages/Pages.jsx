import { consumeNewTripRequest } from '../lib/route';
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { MemoryGrid } from "../components/SidePanel";
import {
  Avatar,
  Chip,
  Empty,
  formatDate,
  Loader,
  LoadingImage,
  DirectionsIcon,
  AppLink,
  TrashIcon,
  Modal,
} from "../components/ui";
import { hrefPlace, hrefCountry, hrefTrip } from "../lib/route";
import { countryName, flagOf } from "../lib/countries";
import { normalize, searchNominatim } from "../lib/geo";
import { PlaceCard } from "../components/SidePanel";
import { useI18n } from "../i18n";
import { pName, pCity } from "../lib/lang";
import Combobox from "../components/Combobox";
import DateInput from "../components/DateInput";
import { TripPlan, TripChecklists } from "./TripPlan";
import TripCosts from "./TripCosts";
import DuplicateTrip from "./DuplicateTrip";
import TripMembers, { MyTripInvites } from "../components/TripMembers";
import GearPromo from "../components/GearPromo";
import { TripReadOnly, isTripViewer, hideRemovedStops, tripDuration, planPlaceCount } from "../lib/tripAccess";
import AdSlot from "../components/AdSlot";
import CurrencyRates from "../components/CurrencyRates";
import { currencyOfCountry, fetchMarketRates } from "../lib/rates";
import DestinationPicker, {
  destLabel,
  cleanDests,
} from "../components/DestinationPicker";

const TRIP_EMOJIS = [
  "🧳",
  "🏖️",
  "🏔️",
  "🌸",
  "🍜",
  "🎒",
  "🚗",
  "✈️",
  "🏕️",
  "🎉",
];
/** Khoảng ngày của chuyến đi: "12/03/2026 → 15/03/2026" */
export const tripDates = (tr) =>
  tr?.startDate
    ? `${formatDate(tr.startDate)}${tr.endDate && tr.endDate !== tr.startDate ? ` → ${formatDate(tr.endDate)}` : ""}`
    : tr?.endDate
      ? `→ ${formatDate(tr.endDate)}`
      : "";

/** Sửa tên, biểu tượng, ngày xuất phát và ngày quay về của chuyến đi */
function TripEditor({ trip, onClose }) {
  const { api, notify } = useApp();
  const { t } = useI18n();
  const [name, setName] = useState(trip.name || "");
  const [emoji, setEmoji] = useState(trip.emoji || "🧳");
  const [start, setStart] = useState(trip.startDate || "");
  const [end, setEnd] = useState(trip.endDate || "");
  const [kind, setKind] = useState(trip.kind || "domestic");
  const [dests, setDests] = useState(trip.destinations || []);
  const [fx, setFx] = useState({
    base: trip.currency || "VND",
    rates: trip.rates || {},
  });
  const { homeCountry } = useApp();
  const destCurs = [
    ...new Set(
      cleanDests(dests)
        .map((d) => currencyOfCountry(d.cc))
        .filter(Boolean),
    ),
  ];
  const showFx =
    destCurs.some((c) => c !== fx.base) || Object.keys(fx.rates).length > 0;
  const changeDests = (d) => {
    setDests(d);
    // Tự chọn loại chuyến theo điểm đến (vẫn đổi tay được)
    const ccs = cleanDests(d).map((x) => x.cc);
    if (ccs.length)
      setKind(
        ccs.some((c) => c !== homeCountry) ? "international" : "domestic",
      );
  };
  const [busy, setBusy] = useState(false);
  const bad = start && end && end < start;
  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return notify(t("trip.nameRequired"), "error");
    if (bad) return notify(t("trip.endBeforeStart"), "error");
    setBusy(true);
    try {
      await api.updateTrip(trip.id, {
        name: name.trim(),
        emoji,
        startDate: start || null,
        endDate: end || null,
        kind,
        destinations: cleanDests(dests),
        currency: fx.base,
        rates: fx.rates,
      });
      notify(t("trip.updated"));
      onClose();
    } catch (err) {
      notify(err.message, "error");
      setBusy(false);
    }
  };
  return (
    <form className="card stack trip-editor" onSubmit={save}>
      <div className="trip-summary__head">
        <h3 className="h3">✏️ {t("trip.editTitle")}</h3>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          ✕
        </button>
      </div>
      <label className="field">
        <span>{t("trip.nameLabel")}</span>
        <div className="row">
          <select
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="emoji-select"
            aria-label={t("trips.icon")}
          >
            {[...new Set([emoji, ...TRIP_EMOJIS])].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <input
            className="grow"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={t("trips.namePlaceholder")}
          />
        </div>
      </label>
      <div className="field">
        <span>📍 {t("dest.label")}</span>
        <DestinationPicker value={dests} onChange={changeDests} />
      </div>
      {showFx && (
        <div className="field">
          <span>💱 {t("fx.title")}</span>
          <CurrencyRates value={fx} onChange={setFx} suggest={destCurs} />
        </div>
      )}
      <div className="grid-2">
        <label className="field">
          <span>🛫 {t("trip.startDate")}</span>
          <DateInput
            value={start}
            onChange={setStart}
            ariaLabel={t("trip.startDate")}
          />
        </label>
        <label className="field">
          <span>🛬 {t("trip.endDate")}</span>
          <DateInput
            value={end}
            onChange={setEnd}
            ariaLabel={t("trip.endDate")}
          />
        </label>
      </div>
      {bad && <p className="warn small">{t("trip.endBeforeStart")}</p>}
      <div className="field">
        <span>{t("trip.kindLabel")}</span>
        <div className="segmented">
          {["domestic", "international"].map((k) => (
            <button
              key={k}
              type="button"
              className={kind === k ? "on" : ""}
              onClick={() => setKind(k)}
            >
              {k === "domestic" ? "🏠" : "🌏"} {t("trip.kind." + k)}
            </button>
          ))}
        </div>
      </div>
      <div className="row wrap">
        <button className="btn btn--primary" disabled={busy || bad}>
          💾 {t("trip.save")}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {t("pick.cancel")}
        </button>
      </div>
    </form>
  );
}

/** Bộ lọc dùng chung: tìm theo chữ + chọn bất kỳ quốc gia + gõ/chọn thành phố */
function useFilters(items, getPlace) {
  const [text, setText] = useState("");
  const [cc, setCc] = useState("");
  const [city, setCity] = useState("");
  const { t, lang } = useI18n();
  const { countries: geo, famousFor, ensureFamous } = useApp();
  const listId = useMemo(
    () => `cities-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  // Tất cả quốc gia trên thế giới; quốc gia đang có dữ liệu được đưa lên đầu
  const withData = useMemo(
    () => new Set(items.map((i) => getPlace(i)?.country).filter(Boolean)),
    [items, getPlace],
  );
  const allCountries = useMemo(() => {
    const ccs = new Set(
      (geo?.features || []).map((f) => f.properties.cc).filter(Boolean),
    );
    withData.forEach((c) => ccs.add(c));
    const byName = (x, y) => countryName(x).localeCompare(countryName(y), lang);
    const all = [...ccs];
    return {
      top: all.filter((c) => withData.has(c)).sort(byName),
      rest: all.filter((c) => !withData.has(c)).sort(byName),
    };
  }, [geo, withData, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nạp địa điểm nổi tiếng của quốc gia đã chọn để gợi ý tên thành phố
  useEffect(() => ensureFamous(cc), [cc, ensureFamous]);
  const cities = useMemo(() => {
    const fromItems = items
      .filter((i) => !cc || getPlace(i)?.country === cc)
      .map((i) => pCity(getPlace(i)));
    const fromFamous = cc ? famousFor(cc).map((p) => pCity(p)) : [];
    return [...new Set([...fromItems, ...fromFamous].filter(Boolean))].sort(
      (x, y) => x.localeCompare(y, lang),
    );
  }, [items, cc, getPlace, lang, famousFor]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const n = normalize(text.trim());
    const nc = normalize(city.trim());
    return items.filter((i) => {
      const p = getPlace(i) || {};
      if (cc && p.country !== cc) return false;
      if (nc && !normalize(`${pCity(p)} ${p.city}`).includes(nc)) return false;
      if (
        n &&
        !normalize(
          `${p.name} ${pName(p)} ${p.city} ${pCity(p)} ${countryName(p.country)} ${i.caption || ""} ${i.authorName || ""}`,
        ).includes(n)
      )
        return false;
      return true;
    });
  }, [items, text, cc, city, getPlace, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const countryOptions = useMemo(
    () => [
      ...allCountries.top.map((c) => ({
        value: c,
        label: countryName(c),
        icon: flagOf(c),
        group: t("filter.withData"),
      })),
      ...allCountries.rest.map((c) => ({
        value: c,
        label: countryName(c),
        icon: flagOf(c),
        group: t("filter.allWorld"),
      })),
    ],
    [allCountries, t],
  );
  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c, label: c })),
    [cities],
  );

  const ui = (
    <div className="filters">
      <input
        className="filters__search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("filter.search")}
      />
      <Combobox
        value={cc}
        options={countryOptions}
        onChange={(v) => {
          setCc(v);
          setCity("");
        }}
        placeholder={t("filter.countryPlaceholder")}
        allLabel={t("filter.allCountries")}
        ariaLabel={t("filter.byCountry")}
        icon="🌏"
      />
      <Combobox
        value={city}
        options={cityOptions}
        onChange={setCity}
        placeholder={t("filter.cityPlaceholder")}
        allLabel={t("filter.allCities")}
        ariaLabel={t("filter.byCity")}
        allowFree
        icon="🏙️"
      />
    </div>
  );
  return { filtered, ui, cc, city, text };
}
const memPlace = (m) => m.place;

/** Kết quả địa điểm cho ô tìm kiếm: địa điểm nổi tiếng đã có + tìm trên bản đồ (OpenStreetMap) */
function PlaceMatches({ text, cc, city }) {
  const { t, lang } = useI18n();
  const { famousFor, allLiveFamous } = useApp();
  const [osm, setOsm] = useState([]);
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(8);
  const q = text.trim();
  // Chỉ chọn bộ lọc (quốc gia / thành phố) mà không gõ từ khoá → vẫn hiện danh sách địa điểm tương ứng
  const filterOnly = q.length < 2 && !!cc;
  const local = useMemo(() => {
    const nc = normalize(city.trim());
    if (filterOnly)
      return famousFor(cc).filter(
        (p) => !nc || normalize(`${p.city} ${pCity(p)}`).includes(nc),
      );
    if (q.length < 2) return [];
    const n = normalize(q);
    const pool = cc ? famousFor(cc) : allLiveFamous || [];
    return pool.filter(
      (p) =>
        normalize(`${p.name} ${pName(p)} ${p.desc || ""}`).includes(n) &&
        (!nc || normalize(`${p.city} ${pCity(p)}`).includes(nc)),
    );
  }, [q, cc, city, famousFor, allLiveFamous, lang, filterOnly]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setLimit(8);
    if (q.length < 2) return setOsm([]);
    const ctl = new AbortController();
    setBusy(true);
    const tm = setTimeout(async () => {
      try {
        const query = [q, city.trim()].filter(Boolean).join(", ");
        setOsm(
          await searchNominatim(query, ctl.signal, lang, {
            countrycodes: cc,
            limit: 10,
          }),
        );
      } catch {
        /* bỏ qua lỗi mạng / huỷ */
      }
      setBusy(false);
    }, 450);
    return () => {
      clearTimeout(tm);
      ctl.abort();
    };
  }, [q, cc, city, lang]);
  if (q.length < 2 && !filterOnly) return null;
  const seen = new Set(local.map((p) => normalize(p.name)));
  const list = [
    ...local,
    ...osm.filter((p) => !seen.has(normalize(p.name)) && p.type !== "country"),
  ];
  return (
    <section className="stack" style={{ marginBottom: 24 }}>
      <h3 className="h3">{t("explore.placesFound", { n: list.length })}</h3>
      {busy && !list.length ? (
        <Loader size="sm" />
      ) : list.length ? (
        <>
          <div className="place-grid">
            {list.slice(0, limit).map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
          {list.length > limit && (
            <button
              className="btn btn--soft"
              onClick={() => setLimit((x) => x + 8)}
            >
              {t("country.showMore", { n: list.length - limit })}
            </button>
          )}
        </>
      ) : (
        <p className="muted small">{t("explore.noPlaces")}</p>
      )}
      <h3 className="h3" style={{ marginTop: 8 }}>
        {t("explore.photosFound")}
      </h3>
    </section>
  );
}

export function ExplorePage() {
  const { publicMemories, openCountry, loaded } = useApp();
  const { t } = useI18n();
  const { filtered, ui, cc, city, text } = useFilters(publicMemories, memPlace);
  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{t("explore.eyebrow")}</p>
          <h1 className="h1">{t("explore.title")}</h1>
          <p className="muted">{t("explore.sub")}</p>
        </div>
      </header>
      {ui}
      <PlaceMatches text={text} cc={cc} city={city} />
      {!loaded.public ? (
        <Loader />
      ) : filtered.length ? (
        <MemoryGrid items={filtered} adsEvery={8} />
      ) : (
        <Empty
          emoji="🔭"
          title={t("explore.empty")}
          text={t("explore.emptyHint")}
          action={
            cc && (
              <AppLink
                className="btn btn--primary"
                href={hrefCountry(cc)}
                onClick={() => openCountry(cc)}
              >
                {t("explore.seeFamous", { country: countryName(cc) })}
              </AppLink>
            )
          }
        />
      )}
      <AdSlot placement="explore-bottom" size="banner" />
    </div>
  );
}

export function MemoriesPage() {
  const { can } = useApp();
  const { user, memories, places, requireLogin, setModal, openPlace, loaded } =
    useApp();
  const [tab, setTab] = useState("memories");
  const { t } = useI18n();
  const ts = (v) =>
    v?.toMillis
      ? v.toMillis()
      : typeof v === "number"
        ? v
        : v
          ? Date.parse(v) || 0
          : 0;
  // Kỉ niệm: theo ngày check-in, gần nhất trước (cùng ngày thì cái lưu sau đứng trước)
  const byDate = useMemo(
    () =>
      [...memories].sort(
        (a, b) => ts(b.date) - ts(a.date) || ts(b.createdAt) - ts(a.createdAt),
      ),
    [memories],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const { filtered, ui } = useFilters(byDate, memPlace);
  const wish = places.filter((p) => p.status === "wishlist");
  // Đã đến: mới nhất trước (theo ngày đến, chưa có ngày thì theo lần cập nhật)
  const visited = places
    .filter((p) => p.status === "visited")
    .sort(
      (a, b) =>
        (ts(b.visitedAt) || 0) - (ts(a.visitedAt) || 0) ||
        ts(b.updatedAt) - ts(a.updatedAt),
    );

  if (!user)
    return (
      <div className="page">
        <Empty
          emoji="📸"
          title={t("mine.loginTitle")}
          text={t("mine.loginText")}
          action={
            <button
              className="btn btn--primary"
              onClick={() => requireLogin(() => {})}
            >
              {t("auth.login")}
            </button>
          }
        />
      </div>
    );

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{t("mine.eyebrow")}</p>
          <h1 className="h1">{t("mine.title")}</h1>
        </div>
        <div className="row wrap">
          {can("recap") && (
          <button
            className="btn btn--outline"
            onClick={() => setModal({ type: "recap", mode: "year" })}
          >
            {t("recap.yearButton")}
          </button>
          )}
          <button
            className="btn btn--primary"
            onClick={() => setModal({ type: "memory" })}
          >
            {t("place.addMemory")}
          </button>
        </div>
      </header>
      <div className="chips">
        <Chip active={tab === "memories"} onClick={() => setTab("memories")}>
          {t("mine.tabMemories", { n: memories.length })}
        </Chip>
        <Chip active={tab === "visited"} onClick={() => setTab("visited")}>
          {t("mine.tabVisited", { n: visited.length })}
        </Chip>
        <Chip active={tab === "wishlist"} onClick={() => setTab("wishlist")}>
          {t("mine.tabWish", { n: wish.length })}
        </Chip>
      </div>
      {tab === "memories" && (
        <>
          {ui}
          {!loaded.mine ? (
            <Loader />
          ) : filtered.length ? (
            <MemoryGrid items={filtered} />
          ) : (
            <Empty
              emoji="🧺"
              title={t("mine.empty")}
              text={t("mine.emptyHint")}
            />
          )}
        </>
      )}
      {tab !== "memories" && (
        <PlaceList
          key={tab}
          items={tab === "visited" ? visited : wish}
          onOpen={openPlace}
          groupByCountry
          byRecent={tab === "visited"}
          emptyText={tab === "visited" ? t("mine.noVisited") : t("mine.noWish")}
        />
      )}
      <AdSlot placement="memories-bottom" size="banner" />
    </div>
  );
}

function PlaceList({ items, onOpen, emptyText, groupByCountry, byRecent }) {
  const { filtered, ui } = useFilters(items, (p) => p);
  const { setModal, removePlace, openCountry } = useApp();
  const { t, lang } = useI18n();
  const row = (p) => (
    <div key={p.id} className="list-item list-item--place">
      <span className="list-item__emoji">{p.emoji || "📍"}</span>
      <AppLink
        className="list-item__main"
        href={hrefPlace(p)}
        onClick={() => onOpen(p)}
      >
        <b>{pName(p)}</b>
        <small>
          {flagOf(p.country)}{" "}
          {[pCity(p), countryName(p.country)].filter(Boolean).join(", ")}
        </small>
        {(p.visitedAt || p.occasion) && (
          <small className="list-item__meta">
            {p.visitedAt ? `📅 ${formatDate(p.visitedAt)}` : ""}
            {p.visitedAt && p.occasion ? " · " : ""}
            {p.occasion || ""}
          </small>
        )}
      </AppLink>
      <div className="list-item__actions">
        <button
          className="btn btn--sm btn--soft"
          onClick={() => setModal({ type: "directions", place: p })}
        >
          <DirectionsIcon /> {t("common.directions")}
        </button>
        <button
          className="icon-btn icon-btn--danger"
          onClick={() => removePlace(p)}
          aria-label={t("remove.confirm")}
          title={t("remove.confirm")}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
  // Gom theo quốc gia → tỉnh/thành phố (giống bảng ở trang chủ).
  // Đã đến: nhóm có lần đến gần nhất lên trước; Muốn đi: nhóm nhiều địa điểm nhất lên trước.
  const groups = useMemo(() => {
    if (!groupByCountry) return null;
    const ts = (v) =>
      v?.toMillis
        ? v.toMillis()
        : typeof v === "number"
          ? v
          : v
            ? Date.parse(v) || 0
            : 0;
    const latest = (list) => Math.max(0, ...list.map((p) => ts(p.visitedAt)));
    const order = (a, b, la, lb, na, nb) =>
      (byRecent ? lb - la : 0) || nb - na || 0;
    const g = {};
    filtered.forEach((p) => {
      const cc = p.country || "—";
      const city = pCity(p) || t("group.otherCity");
      ((g[cc] ||= {})[city] ||= []).push(p);
    });
    return Object.entries(g)
      .map(([cc, byCity]) => {
        const all = Object.values(byCity).flat();
        const cities = Object.entries(byCity).sort(
          (a, b) =>
            order(a, b, latest(a[1]), latest(b[1]), a[1].length, b[1].length) ||
            a[0].localeCompare(b[0], lang),
        );
        return { cc, all, cities };
      })
      .sort(
        (a, b) =>
          order(
            a,
            b,
            latest(a.all),
            latest(b.all),
            a.all.length,
            b.all.length,
          ) || countryName(a.cc).localeCompare(countryName(b.cc), lang),
      );
  }, [filtered, groupByCountry, byRecent, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const cityBlocks = (cities) =>
    cities.map(([city, list]) => (
      <div key={city} className="grouped__city grouped__city--page">
        <div className="grouped__cityname">
          🏙️ {city} <span>{list.length}</span>
        </div>
        <div className="list list--cards">{list.map(row)}</div>
      </div>
    ));
  return (
    <>
      {ui}
      {!filtered.length ? (
        <Empty emoji="🗺️" title={emptyText} />
      ) : groups && groups.length === 1 ? (
        // chỉ 1 quốc gia: không cần gom theo quốc gia, chỉ chia theo tỉnh/thành phố
        <div className="stack-sm grouped grouped--page">
          {cityBlocks(groups[0].cities)}
        </div>
      ) : groups ? (
        <div className="stack-sm grouped grouped--page">
          {groups.map(({ cc, all, cities }) => (
            <details
              key={cc}
              className="grouped__country"
              open={groups.length <= 3}
            >
              <summary>
                <span className="grouped__flag">
                  {cc === "—" ? "🌐" : flagOf(cc)}
                </span>
                <b>{cc === "—" ? t("group.otherCountry") : countryName(cc)}</b>
                <span className="grouped__count">{all.length}</span>
                {cc !== "—" && (
                  <AppLink
                    className="icon-btn icon-btn--sm"
                    href={hrefCountry(cc)}
                    title={t("group.viewCountry")}
                    onClick={() => openCountry(cc)}
                  >
                    🗺️
                  </AppLink>
                )}
              </summary>
              <div className="grouped__cities">{cityBlocks(cities)}</div>
            </details>
          ))}
        </div>
      ) : (
        <div className="list list--cards">{filtered.map(row)}</div>
      )}
    </>
  );
}

export function TripsPage() {
  const { can } = useApp();
  const {
    user,
    trips,
    api,
    requireLogin,
    notify,
    activeTripId,
    setActiveTripId,
    setView,
    loaded,
    openTripId: openId,
    setOpenTripId: setOpenId,
    homeCountry,
  } = useApp();
  const [name, setName] = useState("");
  // #/trips?new=1 (vd. mở từ Cẩm nang ở tab mới) → mở sẵn form tạo chuyến
  const [panel, setPanel] = useState(() => (consumeNewTripRequest() ? 'create' : null)); // 'create' | 'join' — form chỉ hiện khi bấm nút
  const [emoji, setEmoji] = useState("🧳");
  const [newDests, setNewDests] = useState([]);
  const [code, setCode] = useState("");
  const [owner, setOwner] = useState("all"); // all | mine | others
  const { t } = useI18n();
  // REQ-007: chuyến không có trong danh sách của mình → thử mở ở chế độ xem bằng link (chủ chuyến bật "ai có link đều xem được")
  const mineOpen = !!user && trips.some((tr) => tr.id === openId);
  const [pub, setPub] = useState(undefined); // undefined = đang tải, null = không xem được
  useEffect(() => {
    if (!openId || mineOpen) return setPub(undefined), undefined;
    if (user && !loaded.trips) return undefined;
    setPub(undefined);
    return api.watchTrip(openId, (tr) => setPub(tr && tr.publicView ? tr : null));
  }, [openId, mineOpen, user?.uid, loaded.trips, api]); // eslint-disable-line react-hooks/exhaustive-deps
  // Đường dẫn trỏ tới chuyến đi không còn / không có quyền xem → về danh sách
  useEffect(() => {
    if (openId && user && loaded.trips && !mineOpen && pub === null) setOpenId(null);
  }, [openId, loaded.trips, mineOpen, user, pub]); // eslint-disable-line react-hooks/exhaustive-deps

  if (openId && !mineOpen && pub) return <TripDetail trip={pub} onBack={() => setOpenId(null)} />;
  if (openId && !mineOpen && pub === undefined && (!user || loaded.trips)) return <Loader />;

  if (!user)
    return (
      <div className="page">
        <Empty
          emoji="🧳"
          title={t("trips.loginTitle")}
          text={t("trips.loginText")}
          action={
            <button
              className="btn btn--primary"
              onClick={() => requireLogin(() => {})}
            >
              {t("auth.login")}
            </button>
          }
        />
      </div>
    );

  const open = trips.find((tr) => tr.id === openId);
  if (open) return <TripDetail trip={open} onBack={() => setOpenId(null)} />;

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{t("trips.eyebrow")}</p>
          <h1 className="h1">{t("trips.title")}</h1>
          <p className="muted">{t("trips.sub")}</p>
        </div>
        <div className="row wrap">
          <button
            className={`btn ${panel === "join" ? "btn--dark" : "btn--outline"}`}
            onClick={() => setPanel(panel === "join" ? null : "join")}
            aria-expanded={panel === "join"}
          >
            🔑 {t("trips.join")}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => setPanel(panel === "create" ? null : "create")}
            aria-expanded={panel === "create"}
          >
            ＋ {t("trips.create")}
          </button>
        </div>
      </header>
      {can("tripInvites") && <MyTripInvites />}
      {panel && (
        <Modal
          title={
            panel === "create"
              ? `＋ ${t("trips.create")}`
              : `🔑 ${t("trips.join")}`
          }
          onClose={() => setPanel(null)}
          className="modal--sm"
        >
          {panel === "create" && (
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!name.trim()) return;
                const destinations = cleanDests(newDests);
                const kind = destinations.some((d) => d.cc !== homeCountry)
                  ? "international"
                  : "domestic";
                // Chuyến có điểm đến nước ngoài: tự thêm tiền tệ nơi đến với tỉ giá thị trường (sửa được sau)
                const base = "VND";
                const curs = [
                  ...new Set(
                    destinations
                      .map((d) => currencyOfCountry(d.cc))
                      .filter((c) => c && c !== base),
                  ),
                ];
                let rates = {};
                if (curs.length) {
                  try {
                    const m = await fetchMarketRates(base, curs);
                    curs.forEach((c) => (rates[c] = m[c] ?? null));
                  } catch {
                    curs.forEach((c) => (rates[c] = null));
                  }
                }
                const tr = await api.createTrip(user, {
                  name: name.trim(),
                  emoji,
                  destinations,
                  kind,
                  currency: base,
                  rates,
                });
                setName("");
                setNewDests([]);
                notify(t("trips.created", { name: tr.name }));
                setPanel(null);
                setOpenId(tr.id);
              }}
            >
              <div className="row">
                <select
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="emoji-select"
                  aria-label={t("trips.icon")}
                >
                  {TRIP_EMOJIS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("trips.namePlaceholder")}
                  className="grow"
                />
              </div>
              <div className="field">
                <span className="small muted">
                  📍 {t("dest.labelOptional")}
                </span>
                <DestinationPicker value={newDests} onChange={setNewDests} />
              </div>
              <button className="btn btn--primary">
                {t("trips.createBtn")}
              </button>
            </form>
          )}
          {panel === "join" && (
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const tr = await api.joinTrip(user, code);
                  notify(t("trips.joined", { name: tr.name }));
                  setCode("");
                  setPanel(null);
                } catch (err) {
                  notify(err.message, "error");
                }
              }}
            >
              <div className="row">
                <input
                  className="grow"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t("trips.codePlaceholder")}
                  maxLength={8}
                  autoFocus
                />
                <button className="btn btn--dark">{t("trips.joinBtn")}</button>
              </div>
            </form>
          )}
        </Modal>
      )}
      {!loaded.trips ? (
        <Loader />
      ) : trips.length === 0 ? (
        <Empty emoji="🎒" title={t("trips.empty")} />
      ) : (
        <>
          <div className="chips trip-filter">
            {[
              ["all", trips.length],
              ["mine", trips.filter((tr) => tr.ownerId === user.uid).length],
              ["others", trips.filter((tr) => tr.ownerId !== user.uid).length],
            ].map(([k, n]) => (
              <Chip key={k} active={owner === k} onClick={() => setOwner(k)}>
                {t("trips.filter." + k)} ({n})
              </Chip>
            ))}
          </div>
          {trips.every((tr) =>
            owner === "mine"
              ? tr.ownerId !== user.uid
              : owner === "others"
                ? tr.ownerId === user.uid
                : false,
          ) && <p className="muted">{t("trips.filterEmpty")}</p>}
          <div className="trip-list">
            {trips
              .filter((tr) =>
                owner === "mine"
                  ? tr.ownerId === user.uid
                  : owner === "others"
                    ? tr.ownerId !== user.uid
                    : true,
              )
              .map((tr) => (
                <article key={tr.id} className="trip-card">
                  <AppLink
                    className="trip-card__main"
                    href={hrefTrip(tr.id)}
                    onClick={() => setOpenId(tr.id)}
                  >
                    <span className="trip-card__emoji">{tr.emoji}</span>
                    <span>
                      <b>{tr.name}</b>
                      <small>
                        {destLabel(tr.destinations) && (
                          <>{destLabel(tr.destinations)} · </>
                        )}
                        {tripDates(tr) && <>🗓️ {tripDates(tr)} · </>}
                        {t("trips.members", { n: tr.memberIds.length })}
                      </small>
                    </span>
                  </AppLink>
                  <div className="trip-card__people">
                    <div className="avatars">
                      {Object.entries(tr.members || {})
                        .sort(([a], [b]) =>
                          a === tr.ownerId ? -1 : b === tr.ownerId ? 1 : 0,
                        )
                        .slice(0, 4)
                        .map(([id, m]) => (
                          <Avatar
                            key={id}
                            name={m.name}
                            photo={m.photo}
                            size={28}
                          />
                        ))}
                    </div>
                    <small className="muted">
                      {t("trips.createdBy")}{" "}
                      <b>
                        {tr.ownerId === user.uid
                          ? t("trips.you")
                          : tr.members?.[tr.ownerId]?.name || "—"}
                      </b>
                    </small>
                  </div>
                  <button
                    className={`btn btn--sm ${activeTripId === tr.id ? "btn--primary" : "btn--soft"}`}
                    onClick={() => {
                      setActiveTripId(activeTripId === tr.id ? null : tr.id);
                      setView("map");
                    }}
                  >
                    🗺️{" "}
                    {activeTripId === tr.id
                      ? t("trips.showing")
                      : t("trips.viewMap")}
                  </button>
                </article>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function TripDetail({ trip, onBack }) {
  const { can } = useApp();
  const {
    user,
    api,
    notify,
    setActiveTripId,
    setView,
    openPlace,
    setModal,
    tripTab,
    setTripTab,
    setOpenTripId,
    showTripOnMap,
    requireLogin,
  } = useApp();
  const tab = ["plan", "costs", "checklist", "journey"].includes(tripTab)
    ? tripTab
    : "plan";
  const { t } = useI18n();
  const [stops, setStops] = useState(null);
  const [editing, setEditing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) =>
      !e.target.closest?.(".trip-hero__menu") && setMenuOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);
  const isMember = !!user && (trip.memberIds || []).includes(user.uid);
  // REQ-001: thành viên chỉ xem — không sửa được, nhưng sao chép được chuyến về tài khoản của mình
  // REQ-007: người xem bằng link (không phải thành viên) cũng ở chế độ chỉ xem
  const linkViewer = !isMember;
  const readOnly = linkViewer || isTripViewer(trip, user?.uid);
  useEffect(() => (isMember ? api.watchStops(trip.id, setStops) : (setStops([]), undefined)), [trip.id, api, isMember]);
  // REQ-012: cả các mục đã xoá khỏi kế hoạch, để ẩn chúng khỏi Hành trình
  const [planAll, setPlanAll] = useState([]);
  // Người xem bằng link cũng đọc được kế hoạch → dùng để đếm số địa điểm (REQ-014)
  useEffect(() => api.watchPlan(trip.id, setPlanAll, { includeRemoved: true }), [trip.id, api]);
  const [showMembers, setShowMembers] = useState(false);
  const link = `${location.origin}${location.pathname}#join=${trip.inviteCode}`;
  // eslint-disable-next-line no-unused-vars
  const share = async () => {
    const text = t("trip.inviteText", { name: trip.name, emoji: trip.emoji });
    if (navigator.share) {
      try {
        await navigator.share({ title: trip.name, text, url: link });
        return;
      } catch {
        /* huỷ */
      }
    }
    await navigator.clipboard?.writeText(link);
    notify(t("trip.copied"));
  };
  const stopList = useMemo(() => hideRemovedStops(stops || [], planAll), [stops, planAll]);
  const countries = [
    ...new Set(stopList.map((s) => s.place.country).filter(Boolean)),
  ];
  return (
    <div className="page">
      <button className="back" onClick={onBack}>
        {t("trip.back")}
      </button>
      <header className="trip-hero">
        <div className="trip-hero__top">
          <span className="trip-hero__emoji">{trip.emoji}</span>
          <div className="trip-hero__title">
            <h1>{trip.name}</h1>
            <div className="trip-hero__facts">
              {tripDates(trip) && (
                <span className="fact">🗓️ {tripDates(trip)}</span>
              )}
              {destLabel(trip.destinations) && (
                <span className="fact">{destLabel(trip.destinations)}</span>
              )}
              {/* REQ-014: độ dài chuyến; thành viên thấy số điểm dừng (Hành trình), người xem bằng link thấy số địa điểm trong kế hoạch */}
              {tripDuration(trip.startDate, trip.endDate) && (
                <span className="fact">🌙 {t("trip.duration", tripDuration(trip.startDate, trip.endDate))}</span>
              )}
              {linkViewer ? (
                <span className="fact">📍 {t("trip.planPlaces", { n: planPlaceCount(planAll) })}</span>
              ) : (
                <span className="fact">
                  👣 {t("trip.stops", { n: stopList.length })}
                </span>
              )}
            </div>
          </div>
          {isMember && (
            <div className="trip-hero__menu">
              <button
                className="icon-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t("trip.more")}
                title={t("trip.more")}
              >
                ⋯
              </button>
              {menuOpen && (
                <div
                  className="trip-menu"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  {!readOnly && (
                  <button
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    ✏️ {t("trip.edit")}
                  </button>
                  )}
                  {(can("tripDuplicate") || readOnly) && (
                  <button
                    onClick={() => {
                      setDuplicating(true);
                      setMenuOpen(false);
                    }}
                  >
                    📋 {t("dup.button")}
                  </button>
                  )}
                  <hr />
                  <button
                    className="danger"
                    onClick={async () => {
                      setMenuOpen(false);
                      const owner = trip.ownerId === user.uid;
                      if (
                        !confirm(
                          owner
                            ? t("trip.confirmDelete")
                            : t("trip.confirmLeave"),
                        )
                      )
                        return;
                      await api.leaveTrip(user, trip);
                      setActiveTripId(null);
                      onBack();
                    }}
                  >
                    {trip.ownerId === user.uid ? (
                      <>
                        <TrashIcon /> {t("trip.delete")}
                      </>
                    ) : (
                      t("trip.leave")
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="trip-hero__bottom">
          <div className="trip-hero__people">
            <div className="avatars">
              {Object.entries(trip.members || {})
                .sort(([a], [b]) =>
                  a === trip.ownerId ? -1 : b === trip.ownerId ? 1 : 0,
                )
                .slice(0, 5)
                .map(([id, m]) => (
                  <span
                    key={id}
                    title={`${m.name}${id === trip.ownerId ? ` · ${t("trip.owner")}` : ""}`}
                  >
                    <Avatar name={m.name} photo={m.photo} size={30} />
                  </span>
                ))}
            </div>
            <span className="small">
              {Object.values(trip.members || {})
                .map((m) => m.name)
                .slice(0, 3)
                .join(", ")}
              {Object.keys(trip.members || {}).length > 3
                ? ` +${Object.keys(trip.members).length - 3}`
                : ""}
            </span>
            {!linkViewer && (
            <button
              className="invite-code"
              title={t("tm.title")}
              onClick={() => setShowMembers(true)}
            >
              👥 {t("tm.manage")}
            </button>
            )}
            {showMembers && (
              <TripMembers trip={trip} onClose={() => setShowMembers(false)} />
            )}
          </div>
          <div className="trip-hero__actions">
            {!readOnly && (
            <button className="btn btn--primary" onClick={() => setShowMembers(true)}>
              {t("trip.invite")}
            </button>
            )}
            {can("recap") && !linkViewer && (
            <button
              className="btn btn--outline"
              disabled={!stopList.length}
              onClick={() =>
                setModal({ type: "recap", mode: "trip", trip, stops: stopList })
              }
            >
              {t("recap.shareTrip")}
            </button>
            )}
            {!linkViewer && (
            <button
              className="btn btn--dark"
              onClick={() => showTripOnMap(trip.id)}
            >
              {t("trip.onMap")}
            </button>
            )}
          </div>
        </div>
      </header>
      {editing && <TripEditor trip={trip} onClose={() => setEditing(false)} />}
      {duplicating && (
        <DuplicateTrip
          trip={trip}
          onClose={() => setDuplicating(false)}
          onCreated={(tr) => {
            setDuplicating(false);
            setTripTab("plan");
            setOpenTripId(tr.id);
          }}
        />
      )}
      {readOnly && (
        <div className="trip-ro-banner" role="status">
          <span className="trip-ro-banner__text">
            <b>👀 {t(linkViewer ? "pub.bannerTitle" : "ro.title")}</b>
            <small>{t(linkViewer ? "pub.bannerText" : "ro.text", { owner: trip.members?.[trip.ownerId]?.name || t("trip.owner") })}</small>
          </span>
          <button className="btn btn--sm btn--primary" onClick={() => (user ? setDuplicating(true) : requireLogin(() => setDuplicating(true)))}>
            📋 {t("ro.copy")}
          </button>
        </div>
      )}
      <div className="chips trip-tabs">
        {[
          ["plan", `🗓️ ${t("plan.tab")}`],
          ["costs", `💰 ${t("cost.tab")}`],
          ["checklist", `✅ ${t("check.tab")}`],
          ["journey", `👣 ${t("trip.journey")} (${stopList.length})`],
        ]
          .filter(([id]) => (id === "costs" ? can("tripCosts") && (!linkViewer || trip.publicCosts) : id === "checklist" ? can("tripChecklist") : id === "journey" ? !linkViewer : true))
          .map(([id, label]) => (
          <button
            key={id}
            className={`chip ${tab === id ? "chip--on" : ""}`}
            onClick={() => setTripTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <TripReadOnly.Provider value={readOnly}>
      {tab === "plan" && <TripPlan trip={trip} />}
      {tab === "costs" && can("tripCosts") && (!linkViewer || trip.publicCosts) && <TripCosts trip={trip} />}
      {tab === "checklist" && can("tripChecklist") && (
        <>
          {can("gear") && <GearPromo />}
          <TripChecklists trip={trip} />
        </>
      )}
      </TripReadOnly.Provider>
      {tab === "journey" && !linkViewer && stopList.length > 0 && (
        <TripSummary trip={trip} stops={stopList} />
      )}
      {tab === "journey" && (
        <section>
          <h3 className="section-title">{t("trip.journey")}</h3>
          {!stops ? (
            <Loader />
          ) : stops.length === 0 ? (
            <Empty
              emoji="📍"
              title={t("trip.noStops")}
              text={t("trip.noStopsHint")}
            />
          ) : (
            <ol className="timeline">
              {stops.map((s) => (
                <li key={s.id}>
                  <div className="timeline__dot">
                    {s.kind === "memory" ? "📸" : "👣"}
                  </div>
                  <div className="timeline__body">
                    <AppLink
                      className="link"
                      href={hrefPlace(s.place)}
                      onClick={() => openPlace(s.place)}
                    >
                      <b>{pName(s.place)}</b>
                    </AppLink>
                    <div className="small muted">
                      {flagOf(s.place.country)}{" "}
                      {[pCity(s.place), countryName(s.place.country)]
                        .filter(Boolean)
                        .join(", ")}{" "}
                      · {t("trip.by", { name: s.byName })}
                      {s.createdAt ? ` · ${formatDate(s.createdAt)}` : ""}
                    </div>
                    {s.caption && <p>{s.caption}</p>}
                    {s.photos?.length > 0 && (
                      <div className="timeline__photos">
                        {s.photos.slice(0, 4).map((p) => (
                          <button
                            key={p}
                            onClick={() =>
                              setModal({
                                type: "viewMemory",
                                memory: {
                                  id: s.id,
                                  memoryId: s.memoryId,
                                  uid: "trip-stop",
                                  authorName: s.byName,
                                  authorPhoto: s.byPhoto,
                                  place: s.place,
                                  caption: s.caption,
                                  photos: s.photos,
                                },
                              })
                            }
                          >
                            <LoadingImage src={p} alt="" loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      <AdSlot placement="trip-bottom" size="banner" />
    </div>
  );
}

/** Tổng hợp chuyến đi: số liệu + địa điểm nhóm theo quốc gia / thành phố */
function TripSummary({ trip, stops }) {
  const { can } = useApp();
  const { t } = useI18n();
  const { openPlace, setModal } = useApp();
  const sum = useMemo(() => {
    const placesMap = new Map();
    const byPlace = {};
    stops.forEach((s) => {
      if (!s.place) return;
      placesMap.set(s.place.id, s.place);
      const b = (byPlace[s.place.id] ||= { photos: 0, people: new Set() });
      b.photos += (s.photos || []).length;
      if (s.byName) b.people.add(s.byName);
    });
    const list = [...placesMap.values()];
    const groups = {};
    list.forEach((p) => {
      const cc = p.country || "—";
      const city = pCity(p) || "—";
      ((groups[cc] ||= {})[city] ||= []).push(p);
    });
    const times = stops
      .map((s) =>
        s.createdAt?.toMillis ? s.createdAt.toMillis() : s.createdAt,
      )
      .filter(Boolean);
    return {
      list,
      groups,
      byPlace,
      countries: Object.keys(groups).filter((c) => c !== "—").length,
      cities: new Set(list.map((p) => pCity(p)).filter(Boolean)).size,
      photos: stops.reduce((n, s) => n + (s.photos || []).length, 0),
      from: times.length ? Math.min(...times) : null,
      to: times.length ? Math.max(...times) : null,
    };
  }, [stops]);
  return (
    <section className="card trip-summary">
      <div className="trip-summary__head">
        <h3 className="h3">{t("recap.tripSummary")}</h3>
        {can("recap") && (
        <button
          className="btn btn--sm btn--primary"
          onClick={() => setModal({ type: "recap", mode: "trip", trip, stops })}
        >
          {t("recap.shareTrip")}
        </button>
        )}
      </div>
      <div className="stats stats--4">
        <div className="stat">
          <div className="stat__value">📍 {sum.list.length}</div>
          <div className="stat__label">{t("recap.places")}</div>
        </div>
        <div className="stat">
          <div className="stat__value">🌏 {sum.countries}</div>
          <div className="stat__label">{t("recap.countries")}</div>
        </div>
        <div className="stat">
          <div className="stat__value">🏙️ {sum.cities}</div>
          <div className="stat__label">{t("recap.cities")}</div>
        </div>
        <div className="stat">
          <div className="stat__value">📸 {sum.photos}</div>
          <div className="stat__label">{t("recap.photos")}</div>
        </div>
      </div>
      {(tripDates(trip) || sum.from) && (
        <p className="small muted">
          🗓️{" "}
          {tripDates(trip) ||
            formatDate(sum.from) +
              (sum.to && formatDate(sum.to) !== formatDate(sum.from)
                ? ` → ${formatDate(sum.to)}`
                : "")}{" "}
          · 👥 {Object.keys(trip.members || {}).length} {t("recap.members")}
        </p>
      )}
      <div className="trip-groups">
        {Object.entries(sum.groups).map(([cc, cities]) => (
          <div key={cc} className="trip-group">
            <b>
              {flagOf(cc)} {countryName(cc) || cc}
            </b>
            {Object.entries(cities).map(([city, ps]) => (
              <div key={city} className="trip-group__city">
                <span className="muted small">🏙️ {city}</span>
                <div className="chips">
                  {ps.map((p) => (
                    <AppLink
                      key={p.id}
                      className="chip chip--sm"
                      href={hrefPlace(p)}
                      onClick={() => openPlace(p)}
                    >
                      {p.emoji || "📍"} {pName(p)}
                      {sum.byPlace[p.id]?.photos
                        ? ` · 📸${sum.byPlace[p.id].photos}`
                        : ""}
                    </AppLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
