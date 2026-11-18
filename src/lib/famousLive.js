import { fixPlace } from './fixes';
// Famous places for any country, loaded on demand from Wikidata (via the fast QLever SPARQL endpoint)
// and ranked by how many Wikipedia language editions cover them. Cached in localStorage for 7 days.
import { famousIn } from '../data/places';
import { normalize } from './geo';
import countriesLib from 'i18n-iso-countries';

const ENDPOINT = 'https://qlever.cs.uni-freiburg.de/api/wikidata';
const CACHE_KEY = (cc) => `travel-map-famous-v4-${cc}`;
const TTL = 7 * 24 * 3600 * 1000;

// Wikidata classes we treat as "places worth visiting" → emoji
const TYPES = {
  Q9259: '🏛️', // World Heritage Site (via heritage designation)
  Q570116: '📸', // tourist attraction
  Q46169: '🌲', // national park
  Q16560: '🏰', // palace
  Q23413: '🏰', // castle
  Q44539: '⛩️', // temple
  Q5393308: '🛕', // Buddhist temple
  Q842402: '🛕', // Hindu temple
  Q32815: '🕌', // mosque
  Q2977: '⛪', // cathedral
  Q16970: '⛪', // church building
  Q33506: '🖼️', // museum
  Q207694: '🖼️', // art museum
  Q12280: '🌉', // bridge
  Q8502: '⛰️', // mountain
  Q40080: '🏖️', // beach
  Q23397: '💧', // lake
  Q34038: '💦', // waterfall
  Q1107656: '🌷', // garden
  Q22698: '🌳', // park
  Q4989906: '🗿', // monument
  Q11303: '🏙️', // skyscraper
  Q12518: '🗼', // tower
  Q1440300: '🗼', // observation tower
  Q35509: '🦇', // cave
  Q23442: '🏝️', // island
  Q8072: '🌋', // volcano
  Q839954: '🏺', // archaeological site
  Q174782: '🏛️', // square
  Q2416723: '🎢', // theme park
  Q167346: '🌺', // botanical garden
  Q43501: '🦁', // zoo
  Q1081138: '📜', // historic site
  Q15243209: '🏘️', // historic district
  Q10624527: '🗿', // (sculpture/statue-like)
  Q1137809: '🏯', // landmark building
  Q199451: '🛕', // pagoda
  Q1370598: '🙏', // place of worship
  Q24398318: '⛪', // religious building
  Q44613: '🛕', // monastery
  Q160742: '⛪', // abbey
  Q133056: '🛣️', // mountain pass
  Q39594: '🌊', // bay
  Q179700: '🗽', // statue
  Q5003624: '🕯️', // memorial
  Q575759: '🕯️', // war memorial
  Q153562: '🎭', // opera house
  Q24354: '🎭', // theatre
  Q1785071: '🏰', // fort
  Q57821: '🏰', // fortification
  Q88291: '🏯', // citadel
  Q1007870: '🖼️', // art gallery
  Q194195: '🎡', // amusement park
  Q330284: '🛍️', // marketplace
  Q37654: '🛍️', // market
  Q150784: '🏞️', // canyon
  Q473972: '🌿', // protected area
  Q179049: '🌿', // nature reserve
  Q54050: '⛰️', // hill
  Q131681: '💧', // reservoir
  Q185113: '🌊', // cape
  Q2319498: '🏛️', // landmark
};

const PREFIX = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
`;

const query = (cc) => `${PREFIX}
SELECT ?item (SAMPLE(?coord_) AS ?coord) (MAX(?links_) AS ?links) (SAMPLE(?en_) AS ?en) (SAMPLE(?vi_) AS ?vi)
  (SAMPLE(?type_) AS ?type) (SAMPLE(?cityEn_) AS ?cityEn) (SAMPLE(?cityVi_) AS ?cityVi) (SAMPLE(?dEn_) AS ?descEn) (SAMPLE(?dVi_) AS ?descVi) (SAMPLE(?img_) AS ?img) WHERE {
  ?country wdt:P297 "${cc}" .
  ?item wdt:P17 ?country .
  { ?item wdt:P1435 wd:Q9259 . BIND(wd:Q9259 AS ?type_) } UNION
  { VALUES ?type_ { ${Object.keys(TYPES).filter((k) => k !== 'Q9259').map((k) => `wd:${k}`).join(' ')} } ?item wdt:P31 ?type_ . }
  ?item wdt:P625 ?coord_ . ?item wikibase:sitelinks ?links_ . FILTER(?links_ >= ${cc === 'VN' ? 2 : 4})
  OPTIONAL { ?item wdt:P18 ?img_ }
  OPTIONAL { ?item rdfs:label ?en_ FILTER(LANG(?en_)="en") }
  OPTIONAL { ?item rdfs:label ?vi_ FILTER(LANG(?vi_)="vi") }
  OPTIONAL { ?item schema:description ?dEn_ FILTER(LANG(?dEn_)="en") }
  OPTIONAL { ?item schema:description ?dVi_ FILTER(LANG(?dVi_)="vi") }
  OPTIONAL { ?item wdt:P131 ?city . ?city rdfs:label ?cityEn_ FILTER(LANG(?cityEn_)="en") OPTIONAL { ?city rdfs:label ?cityVi_ FILTER(LANG(?cityVi_)="vi") } }
} GROUP BY ?item ORDER BY DESC(?links) LIMIT 250`;

const parsePoint = (wkt = '') => {
  const m = wkt.match(/Point\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
  return m ? { lng: Number(m[1]), lat: Number(m[2]) } : null;
};
const cap = (s = '') => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Big regions rather than places to visit
const NOT_A_PLACE = /\b(prefecture|province|county|district|region|oblast|governorate|municipality|state of)\b|^the architectural work/i;

function toPlace(b, cc) {
  const pt = parsePoint(b.coord?.value);
  const en = b.en?.value;
  if (!pt || !en || NOT_A_PLACE.test(en)) return null;
  const qid = b.item.value.split('/').pop();
  const vi = b.vi?.value;
  const type = b.type?.value.split('/').pop();
  const countryEn = countriesLib.getName(cc, 'en') || '';
  const clean = (s = '') => s.replace(/\s+(Prefecture|Province|Governorate|Oblast|Region|District|County)$/i, '').replace(/^(Tỉnh|Thành phố|Quận|Huyện)\s+/i, '');
  const isCountry = (s) => !s || s === countryEn || s === countriesLib.getName(cc, 'vi');
  const cityEn = !isCountry(b.cityEn?.value) && b.cityEn.value !== en ? clean(b.cityEn.value) : '';
  const cityVi = !isCountry(b.cityVi?.value) && b.cityVi.value !== vi ? clean(b.cityVi.value) : cityEn;
  // Đảo lớn trực thuộc thẳng quốc gia (Kyushu, Shikoku…) là vùng, không phải điểm tham quan
  if (type === 'Q23442' && !cityEn) return null;
  return {
    id: `wd-${qid}`,
    name: cap(vi || en),
    city: cc === 'VN' ? cityVi : cityEn,
    desc: cap(b.descVi?.value || ''),
    country: cc,
    lat: pt.lat,
    lng: pt.lng,
    emoji: TYPES[type] || '📍',
    famous: true,
    rank: Number(b.links?.value || 0),
    wikidata: qid,
    image: b.img?.value ? `${b.img.value.replace(/^http:/, 'https:')}?width=640` : '',
    i18n: { en: { name: cap(en), city: cityEn, desc: cap(b.descEn?.value || '') } },
  };
}

const distKm = (a, b) => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng) * 6371;
};

/** Fetch (or read cache) of live famous places for a country, de-duplicated against the curated list. */
export async function loadFamousLive(cc, bounds) {
  if (!cc) return [];
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY(cc)) || 'null');
    if (cached && Date.now() - cached.t < TTL) return cached.list.map(fixPlace);
  } catch {
    /* ignore */
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query(cc))}`, {
      headers: { Accept: 'application/sparql-results+json' },
      signal: ctl.signal,
    });
    const json = await res.json();
    const curated = famousIn(cc);
    const seen = new Set(curated.map((p) => normalize(p.name)));
    const list = [];
    for (const b of json.results?.bindings || []) {
      const p = toPlace(b, cc);
      if (!p) continue;
      // keep places inside the country's bounding box (skips transnational listings)
      if (bounds && !(p.lat >= bounds.s - 0.5 && p.lat <= bounds.n + 0.5 && p.lng >= bounds.w - 0.5 && p.lng <= bounds.e + 0.5)) continue;
      const key = normalize(p.name);
      if (seen.has(key) || seen.has(normalize(p.i18n.en.name))) continue;
      if (curated.some((c) => distKm(c, p) < 1.2) || list.some((c) => distKm(c, p) < 0.3)) continue;
      seen.add(key);
      list.push(p);
    }
    try {
      localStorage.setItem(CACHE_KEY(cc), JSON.stringify({ t: Date.now(), list }));
    } catch {
      /* storage full */
    }
    return list.map(fixPlace);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
