/**
 * astroEngine.js
 *
 * Vedic astrology calculation engine, extracted verbatim from the original
 * single-file ASTRO source (ASTRO_Vedic_Astrology_App.txt).
 *
 * Contains: zodiac/nakshatra/dasha reference data, ephemeris math (Meeus
 * solar system model, Julian day, Lahiri ayanamsa, Kepler solver),
 * Vimshottari Dasha computation, rule-based Yoga detection, the North
 * Indian chart house/placement helpers, the Personal Life Overview
 * generator, full chart computation, current transits, and the 8-Koota
 * Ashtakoota compatibility scoring.
 *
 * No calculation logic has been modified during this split — only the
 * `export` keyword was added to each top-level declaration so these can
 * be imported from App.jsx and NorthIndianChart.jsx.
 */

export const ZODIAC_SIGNS = [
  { id: 1, name: 'Aries', sanskrit: 'Mesha', element: 'Fire', lord: 'Mars', symbol: '♈', varna: 'Kshatriya', vashyaType: 'Chatushpada' },
  { id: 2, name: 'Taurus', sanskrit: 'Vrishabha', element: 'Earth', lord: 'Venus', symbol: '♉', varna: 'Vaishya', vashyaType: 'Chatushpada' },
  { id: 3, name: 'Gemini', sanskrit: 'Mithuna', element: 'Air', lord: 'Mercury', symbol: '♊', varna: 'Shudra', vashyaType: 'Manava' },
  { id: 4, name: 'Cancer', sanskrit: 'Karka', element: 'Water', lord: 'Moon', symbol: '♋', varna: 'Brahmin', vashyaType: 'Jalachara' },
  { id: 5, name: 'Leo', sanskrit: 'Simha', element: 'Fire', lord: 'Sun', symbol: '♌', varna: 'Kshatriya', vashyaType: 'Vanchara' },
  { id: 6, name: 'Virgo', sanskrit: 'Kanya', element: 'Earth', lord: 'Mercury', symbol: '♍', varna: 'Vaishya', vashyaType: 'Manava' },
  { id: 7, name: 'Libra', sanskrit: 'Tula', element: 'Air', lord: 'Venus', symbol: '♎', varna: 'Shudra', vashyaType: 'Manava' },
  { id: 8, name: 'Scorpio', sanskrit: 'Vrischika', element: 'Water', lord: 'Mars', symbol: '♏', varna: 'Brahmin', vashyaType: 'Keeta' },
  { id: 9, name: 'Sagittarius', sanskrit: 'Dhanu', element: 'Fire', lord: 'Jupiter', symbol: '♐', varna: 'Kshatriya', vashyaType: 'Manava' },
  { id: 10, name: 'Capricorn', sanskrit: 'Makara', element: 'Earth', lord: 'Saturn', symbol: '♑', varna: 'Vaishya', vashyaType: 'Jalachara' },
  { id: 11, name: 'Aquarius', sanskrit: 'Kumbha', element: 'Air', lord: 'Saturn', symbol: '♒', varna: 'Shudra', vashyaType: 'Manava' },
  { id: 12, name: 'Pisces', sanskrit: 'Meena', element: 'Water', lord: 'Jupiter', symbol: '♓', varna: 'Brahmin', vashyaType: 'Jalachara' }
];

export const NAKSHATRAS_LIST = [
  { id: 1, name: 'Ashwini', startDeg: 0.0, endDeg: 13.333333, lord: 'Ketu', deity: 'Ashvini Kumaras', symbol: 'Horse Head', yoni: 'Horse', gana: 'Deva', nadi: 'Adi', themes: 'Swift healing, miraculous beginnings, pioneering initiative, agility' },
  { id: 2, name: 'Bharani', startDeg: 13.333333, endDeg: 26.666667, lord: 'Venus', deity: 'Yama', symbol: 'Yoni / Triangle', yoni: 'Elephant', gana: 'Manushya', nadi: 'Madhya', themes: 'Restraint, creative gestation, transformation, endurance through hardship' },
  { id: 3, name: 'Krittika', startDeg: 26.666667, endDeg: 40.0, lord: 'Sun', deity: 'Agni', symbol: 'Razor / Flame', yoni: 'Sheep', gana: 'Rakshasa', nadi: 'Antya', themes: 'Purification, sharp discrimination, decisive cutting of illusion, radiance' },
  { id: 4, name: 'Rohini', startDeg: 40.0, endDeg: 53.333333, lord: 'Moon', deity: 'Brahma', symbol: 'Ox Cart / Chariot', yoni: 'Serpent', gana: 'Manushya', nadi: 'Antya', themes: 'Sensory beauty, artistic prosperity, fertility, magnetic allure, nourishment' },
  { id: 5, name: 'Mrigashira', startDeg: 53.333333, endDeg: 66.666667, lord: 'Mars', deity: 'Soma', symbol: 'Deer Head', yoni: 'Serpent', gana: 'Deva', nadi: 'Madhya', themes: 'Curious search, intellectual gentleness, travel, pursuit of higher truth' },
  { id: 6, name: 'Ardra', startDeg: 66.666667, endDeg: 80.0, lord: 'Rahu', deity: 'Rudra', symbol: 'Teardrop / Diamond', yoni: 'Dog', gana: 'Manushya', nadi: 'Adi', themes: 'Cathartic storm, emotional breakthrough, renewal following turbulence' },
  { id: 7, name: 'Punarvasu', startDeg: 80.0, endDeg: 93.333333, lord: 'Jupiter', deity: 'Aditi', symbol: 'Bow & Quiver', yoni: 'Cat', gana: 'Deva', nadi: 'Adi', themes: 'Return of the light, restorative optimism, benevolent resilience, renewal' },
  { id: 8, name: 'Pushya', startDeg: 93.333333, endDeg: 106.666667, lord: 'Saturn', deity: 'Brihaspati', symbol: 'Cow Udder / Lotus', yoni: 'Sheep', gana: 'Deva', nadi: 'Madhya', themes: 'Highest spiritual nourishment, patient guardianship, ethical wisdom' },
  { id: 9, name: 'Ashlesha', startDeg: 106.666667, endDeg: 120.0, lord: 'Mercury', deity: 'Nagas', symbol: 'Coiled Serpent', yoni: 'Cat', gana: 'Rakshasa', nadi: 'Antya', themes: 'Intuitive mysticism, psychological penetrating insight, protective secrets' },
  { id: 10, name: 'Magha', startDeg: 120.0, endDeg: 133.333333, lord: 'Ketu', deity: 'Pitris', symbol: 'Royal Throne Room', yoni: 'Rat', gana: 'Rakshasa', nadi: 'Antya', themes: 'Ancestral lineage honor, regal dignity, authority, deep tradition' },
  { id: 11, name: 'Purva Phalguni', startDeg: 133.333333, endDeg: 146.666667, lord: 'Venus', deity: 'Bhaga', symbol: 'Hammock', yoni: 'Rat', gana: 'Manushya', nadi: 'Madhya', themes: 'Playful romance, leisure, theatrical joy, gracious hospitality' },
  { id: 12, name: 'Uttara Phalguni', startDeg: 146.666667, endDeg: 160.0, lord: 'Sun', deity: 'Aryaman', symbol: 'Four Poster Bed', yoni: 'Cow', gana: 'Manushya', nadi: 'Adi', themes: 'Honorable alliances, sustained social patronage, generosity, integrity' },
  { id: 13, name: 'Hasta', startDeg: 160.0, endDeg: 173.333333, lord: 'Moon', deity: 'Savitr', symbol: 'Open Hand', yoni: 'Buffalo', gana: 'Deva', nadi: 'Adi', themes: 'Manual craftsmanship, healing touch, resourceful humor, detail focus' },
  { id: 14, name: 'Chitra', startDeg: 173.333333, endDeg: 186.666667, lord: 'Mars', deity: 'Tvashtar', symbol: 'Bright Jewel', yoni: 'Tiger', gana: 'Rakshasa', nadi: 'Madhya', themes: 'Architectural genius, captivating aesthetics, radiant craftsmanship' },
  { id: 15, name: 'Svati', startDeg: 186.666667, endDeg: 200.0, lord: 'Rahu', deity: 'Vayu', symbol: 'Young Shoot in Breeze', yoni: 'Buffalo', gana: 'Deva', nadi: 'Antya', themes: 'Independent mobility, trade diplomacy, flexibility, philosophical freedom' },
  { id: 16, name: 'Vishakha', startDeg: 200.0, endDeg: 213.333333, lord: 'Jupiter', deity: 'Indra & Agni', symbol: 'Decorated Arch', yoni: 'Tiger', gana: 'Rakshasa', nadi: 'Antya', themes: 'Singular goal attainment, relentless persistence, passionate focus' },
  { id: 17, name: 'Anuradha', startDeg: 213.333333, endDeg: 226.666667, lord: 'Saturn', deity: 'Mitra', symbol: 'Lotus Blossom', yoni: 'Deer', gana: 'Deva', nadi: 'Madhya', themes: 'Loyal devotion, organizational devotion, resilience through foreign ties' },
  { id: 18, name: 'Jyeshtha', startDeg: 226.666667, endDeg: 240.0, lord: 'Mercury', deity: 'Indra', symbol: 'Circular Talisman', yoni: 'Deer', gana: 'Rakshasa', nadi: 'Adi', themes: 'Elder authority, courageous defense, occult guardianship, strategic triumph' },
  { id: 19, name: 'Mula', startDeg: 240.0, endDeg: 253.333333, lord: 'Ketu', deity: 'Nirriti', symbol: 'Tied bunch of roots', yoni: 'Dog', gana: 'Rakshasa', nadi: 'Adi', themes: 'Unearthing root truth, profound spiritual breakdown, dismantling illusion' },
  { id: 20, name: 'Purva Ashadha', startDeg: 253.333333, endDeg: 266.666667, lord: 'Venus', deity: 'Apas', symbol: 'Winnowing Basket', yoni: 'Monkey', gana: 'Manushya', nadi: 'Madhya', themes: 'Invincible confidence, fluid persuasion, purifying speech, inspiration' },
  { id: 21, name: 'Uttara Ashadha', startDeg: 266.666667, endDeg: 280.0, lord: 'Sun', deity: 'Vishwadevas', symbol: 'Elephant Tusk', yoni: 'Mongoose', gana: 'Manushya', nadi: 'Antya', themes: 'Durable victory, unwavering commitment to duty, universal benevolence' },
  { id: 22, name: 'Shravana', startDeg: 280.0, endDeg: 293.333333, lord: 'Moon', deity: 'Vishnu', symbol: 'Ear / 3 Footprints', yoni: 'Monkey', gana: 'Deva', nadi: 'Antya', themes: 'Sacred oral listening, scholarly synthesis, contemplative learning' },
  { id: 23, name: 'Dhanishta', startDeg: 293.333333, endDeg: 306.666667, lord: 'Mars', deity: 'Eight Vasus', symbol: 'Mridanga Drum', yoni: 'Lion', gana: 'Rakshasa', nadi: 'Madhya', themes: 'Rhythmic mastery, material abundance, musical intuition, martial elegance' },
  { id: 24, name: 'Shatabhisha', startDeg: 306.666667, endDeg: 320.0, lord: 'Rahu', deity: 'Varuna', symbol: 'Empty Circle / 100 Healers', yoni: 'Horse', gana: 'Rakshasa', nadi: 'Adi', themes: 'Esoteric healing, meditative seclusion, cosmic boundaries, deep sight' },
  { id: 25, name: 'Purva Bhadrapada', startDeg: 320.0, endDeg: 333.333333, lord: 'Jupiter', deity: 'Aja Ekapada', symbol: 'Front of Funeral Bed', yoni: 'Lion', gana: 'Manushya', nadi: 'Adi', themes: 'Ascetic intensity, fiery spiritual purification, profound tapas, idealism' },
  { id: 26, name: 'Uttara Bhadrapada', startDeg: 333.333333, endDeg: 346.666667, lord: 'Saturn', deity: 'Ahir Budhnya', symbol: 'Back of Funeral Bed', yoni: 'Cow', gana: 'Manushya', nadi: 'Madhya', themes: 'Deep spiritual equanimity, profound contemplation, unshakeable stability' },
  { id: 27, name: 'Revati', startDeg: 346.666667, endDeg: 360.0, lord: 'Mercury', deity: 'Pushan', symbol: 'Fish in the Waters', yoni: 'Elephant', gana: 'Deva', nadi: 'Antya', themes: 'Gentle safe passage, transcendent compassion, universal love, completion' }
];

export const DASHA_ORDER = [
  { lord: 'Ketu', years: 7 },
  { lord: 'Venus', years: 20 },
  { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 10 },
  { lord: 'Mars', years: 7 },
  { lord: 'Rahu', years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn', years: 19 },
  { lord: 'Mercury', years: 17 }
];

export const RAD2DEG = 180.0 / Math.PI;
export const DEG2RAD = Math.PI / 180.0;

export function normalizeDeg(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export function formatDateStr(date) {
  return date.toISOString().split('T')[0];
}

export function generateSecureProfileId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return `astro_profile_${crypto.randomUUID()}`;
    } catch (e) {
      console.warn('UUIDv4 direct call fallback:', e);
    }
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    return `astro_profile_${uuid}`;
  }

  const hexDigits = '0123456789abcdef';
  let randHex = '';
  for (let i = 0; i < 32; i++) {
    randHex += hexDigits[Math.floor(Math.random() * 16)];
  }
  return `astro_profile_${randHex.slice(0, 8)}-${randHex.slice(8, 12)}-4${randHex.slice(13, 16)}-a${randHex.slice(17, 20)}-${randHex.slice(20)}`;
}

export async function searchWorldwideLocations(query, signal) {
  if (!query || query.trim().length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=10&language=en&format=json`;

  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`Geocoding HTTP error ${resp.status}`);
  const data = await resp.json();
  if (!data || !data.results || !Array.isArray(data.results)) return [];

  return data.results.map((r) => {
    const parts = [r.name];
    if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1);
    if (r.country) parts.push(r.country);

    return {
      id: `${r.id}_${r.latitude}_${r.longitude}`,
      name: r.name,
      admin1: r.admin1 || '',
      country: r.country || '',
      country_code: r.country_code || '',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone || 'Asia/Kolkata',
      fullName: parts.join(', ')
    };
  });
}

export function getHistoricalUtcOffset(ianaTimezone, dateStr, timeStr, fallbackLongitude) {
  try {
    const isoString = `${dateStr}T${timeStr}:00Z`;
    const tempDate = new Date(isoString);
    if (isNaN(tempDate.getTime())) throw new Error('Invalid birth date for timezone resolution');

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(tempDate);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');

    if (tzPart && tzPart.value) {
      const match = tzPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1] === '-' ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const mins = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours + mins / 60);
      }
      if (tzPart.value === 'GMT' || tzPart.value === 'UTC') {
        return 0.0;
      }
    }
  } catch (err) {
    console.warn(`IANA resolution warning for ${ianaTimezone}:`, err);
  }

  if (ianaTimezone === 'Asia/Kolkata') return 5.5;
  if (ianaTimezone === 'Europe/London') return 0.0;
  if (ianaTimezone === 'Asia/Tokyo') return 9.0;
  if (ianaTimezone === 'Australia/Sydney') {
    const month = parseInt(dateStr.split('-')[1], 10);
    return (month >= 10 || month <= 3) ? 11.0 : 10.0;
  }
  if (ianaTimezone === 'America/New_York') {
    const month = parseInt(dateStr.split('-')[1], 10);
    return (month >= 4 && month <= 10) ? -4.0 : -5.0;
  }
  return parseFloat((fallbackLongitude / 15.0).toFixed(2));
}

export function toJulianDay(year, month, day, decimalHour) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5 + decimalHour / 24.0;
}

export function getLahiriAyanamsa(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.853222 + 1.396971 * T + 0.000309 * T * T;
}

export function circularAngularDifference(degA, degB) {
  const diff = Math.abs(normalizeDeg(degA) - normalizeDeg(degB));
  return Math.min(diff, 360.0 - diff);
}

export function solveKepler(M_deg, e) {
  const M_rad = M_deg * DEG2RAD;
  let E = M_rad;
  for (let i = 0; i < 20; i++) {
    const dE = (E - e * Math.sin(E) - M_rad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

export function computeMeeusSolarSystem(jd, ayanamsa) {
  const T = (jd - 2451545.0) / 36525.0;

  // Sun
  const L0 = normalizeDeg(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M_sun = normalizeDeg(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C_sun = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M_sun * DEG2RAD) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M_sun * DEG2RAD) +
    0.000289 * Math.sin(3 * M_sun * DEG2RAD);
  const tropicalSun = normalizeDeg(L0 + C_sun);
  const siderealSun = normalizeDeg(tropicalSun - ayanamsa);

  // Moon with Delaunay arguments and Evection/Variation/Annual equation perturbations
  const L_moon = normalizeDeg(218.3164477 + 481267.88123421 * T);
  const D_moon = normalizeDeg(297.8501921 + 445267.1114034 * T);
  const M_moon = normalizeDeg(134.9633964 + 477198.8675055 * T);
  const F_moon = normalizeDeg(93.272095 + 483202.0175233 * T);

  let moonPerturb = 6.288774 * Math.sin(M_moon * DEG2RAD);
  moonPerturb += 1.274027 * Math.sin((2 * D_moon - M_moon) * DEG2RAD); // Evection
  moonPerturb += 0.658314 * Math.sin(2 * D_moon * DEG2RAD); // Variation
  moonPerturb += 0.213618 * Math.sin(2 * M_moon * DEG2RAD);
  moonPerturb -= 0.185116 * Math.sin(M_sun * DEG2RAD); // Annual equation
  moonPerturb -= 0.114332 * Math.sin(2 * F_moon * DEG2RAD);

  const tropicalMoon = normalizeDeg(L_moon + moonPerturb);
  const siderealMoon = normalizeDeg(tropicalMoon - ayanamsa);

  // Mean Rahu Node and Ketu Opposition Invariant
  const omega = normalizeDeg(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
  const siderealRahu = normalizeDeg(omega - ayanamsa);
  const siderealKetu = normalizeDeg(siderealRahu + 180.0);

  function computeKeplerianPlanet(a, e, I_deg, L_deg, longPeri_deg, longNode_deg) {
    const M = normalizeDeg(L_deg - longPeri_deg);
    const E = solveKepler(M, e);
    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const v = Math.atan2(y, x) * RAD2DEG;
    const r = Math.sqrt(x * x + y * y);
    const helioL = normalizeDeg(v + longPeri_deg);

    const x_helio = r * Math.cos(helioL * DEG2RAD);
    const y_helio = r * Math.sin(helioL * DEG2RAD);

    const R_earth = 1.000001018 * (1 - 0.0167086 * Math.cos(M_sun * DEG2RAD));
    const X_sun = R_earth * Math.cos(tropicalSun * DEG2RAD);
    const Y_sun = R_earth * Math.sin(tropicalSun * DEG2RAD);

    const X_geo = x_helio + X_sun;
    const Y_geo = y_helio + Y_sun;
    const tropicalPlanet = normalizeDeg(Math.atan2(Y_geo, X_geo) * RAD2DEG);
    return normalizeDeg(tropicalPlanet - ayanamsa);
  }

  const siderealMerc = computeKeplerianPlanet(0.387098, 0.20563, 7.005, 252.25 + 149472.67 * T, 77.456 + 1.556 * T, 48.331 + 1.186 * T);
  const siderealVen = computeKeplerianPlanet(0.723332, 0.00677, 3.394, 181.979 + 58517.815 * T, 131.563 + 1.402 * T, 76.680 + 0.901 * T);
  const siderealMars = computeKeplerianPlanet(1.52368, 0.0934, 1.85, 355.433 + 19140.299 * T, 336.06 + 1.84 * T, 49.56 + 0.77 * T);
  const siderealJup = computeKeplerianPlanet(5.2026, 0.0485, 1.303, 34.35 + 3034.9 * T, 14.33 + 1.61 * T, 100.46 + 1.02 * T);
  const siderealSat = computeKeplerianPlanet(9.5549, 0.0555, 2.489, 50.08 + 1222.11 * T, 93.06 + 1.96 * T, 113.67 + 0.87 * T);

  return {
    siderealSun,
    siderealMoon,
    siderealMerc,
    siderealVen,
    siderealMars,
    siderealJup,
    siderealSat,
    siderealRahu,
    siderealKetu
  };
}

export function computeVimshottariDasha(siderealMoonDeg, birthDateObj) {
  const normalizedMoon = normalizeDeg(siderealMoonDeg);
  const nakTotalSpan = 360.0 / 27.0;
  const nakIndex = Math.floor(normalizedMoon / nakTotalSpan);
  const moonDegInNak = normalizedMoon % nakTotalSpan;

  const dashaIndex = nakIndex % 9;
  const birthLordMeta = DASHA_ORDER[dashaIndex];
  const birthLordTotalYears = birthLordMeta.years;

  const portionPassed = moonDegInNak / nakTotalSpan;
  const portionRemaining = 1.0 - portionPassed;
  const balanceYears = birthLordTotalYears * portionRemaining;
  const elapsedYears = birthLordTotalYears * portionPassed;

  const MS_PER_SOLAR_YEAR = 365.2425 * 24 * 3600 * 1000;
  const birthTimeMs = birthDateObj.getTime();
  const nominalCycleStartMs = birthTimeMs - (elapsedYears * MS_PER_SOLAR_YEAR);

  const timeline = [];
  let currentStartMs = birthTimeMs;

  for (let i = 0; i < 9; i++) {
    const idx = (dashaIndex + i) % 9;
    const dLord = DASHA_ORDER[idx].lord;
    const nominalYears = DASHA_ORDER[idx].years;

    let periodYears;
    let periodStartMs;
    let periodEndMs;

    if (i === 0) {
      periodYears = balanceYears;
      periodStartMs = birthTimeMs;
      periodEndMs = birthTimeMs + (balanceYears * MS_PER_SOLAR_YEAR);
    } else {
      periodYears = nominalYears;
      periodStartMs = currentStartMs;
      periodEndMs = periodStartMs + (nominalYears * MS_PER_SOLAR_YEAR);
    }

    currentStartMs = periodEndMs;

    const antardashas = [];
    if (i === 0) {
      let adPointerMs = nominalCycleStartMs;
      for (let j = 0; j < 9; j++) {
        const subIdx = (idx + j) % 9;
        const subLord = DASHA_ORDER[subIdx].lord;
        const subYears = (nominalYears * DASHA_ORDER[subIdx].years) / 120.0;
        const adStartMs = adPointerMs;
        const adEndMs = adStartMs + (subYears * MS_PER_SOLAR_YEAR);
        adPointerMs = adEndMs;

        if (adEndMs > birthTimeMs) {
          const effectiveStartMs = Math.max(birthTimeMs, adStartMs);
          antardashas.push({
            lord: subLord,
            start: formatDateStr(new Date(effectiveStartMs)),
            end: formatDateStr(new Date(adEndMs)),
            startMs: effectiveStartMs,
            endMs: adEndMs
          });
        }
      }
    } else {
      let adPointerMs = periodStartMs;
      for (let j = 0; j < 9; j++) {
        const subIdx = (idx + j) % 9;
        const subLord = DASHA_ORDER[subIdx].lord;
        const subYears = (nominalYears * DASHA_ORDER[subIdx].years) / 120.0;
        const adStartMs = adPointerMs;
        const adEndMs = adStartMs + (subYears * MS_PER_SOLAR_YEAR);
        adPointerMs = adEndMs;

        antardashas.push({
          lord: subLord,
          start: formatDateStr(new Date(adStartMs)),
          end: formatDateStr(new Date(adEndMs)),
          startMs: adStartMs,
          endMs: adEndMs
        });
      }
    }

    timeline.push({
      lord: dLord,
      totalYears: parseFloat(periodYears.toFixed(4)),
      nominalYears,
      start: formatDateStr(new Date(periodStartMs)),
      end: formatDateStr(new Date(periodEndMs)),
      startMs: periodStartMs,
      endMs: periodEndMs,
      antardashas
    });
  }

  const nowMs = Date.now();
  let activeMahadasha = timeline.find((t) => nowMs >= t.startMs && nowMs < t.endMs);
  if (!activeMahadasha) {
    activeMahadasha = nowMs < timeline[0].startMs ? timeline[0] : timeline[timeline.length - 1];
  }

  let activeAntardasha = activeMahadasha.antardashas.find((ad) => nowMs >= ad.startMs && nowMs < ad.endMs);
  if (!activeAntardasha) {
    activeAntardasha = activeMahadasha.antardashas[0];
  }

  const endMs = activeAntardasha.endMs;
  const diffDays = Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));
  const remainingMonths = Math.floor(diffDays / 30.4);
  const remainingDays = diffDays % 30;

  return {
    birthLord: birthLordMeta.lord,
    balanceYears: parseFloat(balanceYears.toFixed(4)),
    portionRemaining: parseFloat(portionRemaining.toFixed(4)),
    activeMahadasha: activeMahadasha.lord,
    activeAntardasha: activeAntardasha.lord,
    startDate: activeAntardasha.start,
    endDate: activeAntardasha.end,
    remainingMonths,
    remainingDays,
    fullTimeline: timeline
  };
}

export function detectRuleBasedYogas(planets, houses, lagnaSignIdx) {
  const yogas = [];
  const findP = (name) => planets.find((p) => p.name.toLowerCase() === name.toLowerCase());

  const sunP = findP('Sun');
  const moonP = findP('Moon');
  const marsP = findP('Mars');
  const mercP = findP('Mercury');
  const jupP = findP('Jupiter');
  const venP = findP('Venus');
  const satP = findP('Saturn');

  if (!sunP || !moonP || !jupP || !mercP || !venP || !marsP || !satP) {
    return yogas;
  }

  // 1. GAJAKESARI YOGA
  const jupFromMoon = ((jupP.house - moonP.house + 12) % 12) + 1;
  if ([1, 4, 7, 10].includes(jupFromMoon)) {
    yogas.push({
      name: 'Gajakesari Yoga',
      sanskrit: 'गजकेसरी योग',
      planets: ['Moon', 'Jupiter'],
      houses: [moonP.house, jupP.house],
      rule: 'Jupiter placed in a Kendra (1st, 4th, 7th, or 10th) from the natal Moon',
      significance: 'Traditionally associated with wisdom, enduring reputation, moral virtue, and protective resilience.'
    });
  }

  // 2. BUDHADITYA YOGA (with Combustion & Proximity Guard)
  if (sunP.signIndex === mercP.signIndex && sunP.house === mercP.house) {
    const separationDeg = Math.abs(sunP.degreeInSign - mercP.degreeInSign);
    if (separationDeg >= 3.0 && separationDeg <= 12.0) {
      yogas.push({
        name: 'Budhaditya Yoga',
        sanskrit: 'बुधादित्य योग',
        planets: ['Sun', 'Mercury'],
        houses: [sunP.house],
        rule: `Sun and Mercury conjoined in ${sunP.signName} (House ${sunP.house}) with clear ${separationDeg.toFixed(2)}° separation (non-combust 3°–12° range)`,
        significance: 'Traditionally associated with intellectual discernment, sharp administrative comprehension, and communicative eloquence.'
      });
    }
  }

  // 3. PANCHA MAHAPURUSHA YOGAS
  const kendraHouses = [1, 4, 7, 10];

  // Ruchaka (Mars)
  if (kendraHouses.includes(marsP.house) && [1, 8, 10].includes(marsP.signIndex)) {
    const dignity = marsP.signIndex === 10 ? 'Exalted in Capricorn' : `Own sign in ${marsP.signName}`;
    yogas.push({
      name: 'Ruchaka Yoga',
      sanskrit: 'रुचक योग',
      planets: ['Mars'],
      houses: [marsP.house],
      rule: `Mars placed in Kendra House ${marsP.house} in ${dignity}`,
      significance: 'A Pancha Mahapurusha yoga traditionally associated with physical courage, executive drive, leadership, and bold initiative.'
    });
  }

  // Bhadra (Mercury)
  if (kendraHouses.includes(mercP.house) && [3, 6].includes(mercP.signIndex)) {
    const dignity = mercP.signIndex === 6 ? 'Exalted / Moolatrikona in Virgo' : 'Own sign in Gemini';
    yogas.push({
      name: 'Bhadra Yoga',
      sanskrit: 'भद्र योग',
      planets: ['Mercury'],
      houses: [mercP.house],
      rule: `Mercury placed in Kendra House ${mercP.house} in ${dignity}`,
      significance: 'A Pancha Mahapurusha yoga traditionally associated with analytical mastery, scholarly articulation, and commerce.'
    });
  }

  // Hamsa (Jupiter)
  if (kendraHouses.includes(jupP.house) && [4, 9, 12].includes(jupP.signIndex)) {
    const dignity = jupP.signIndex === 4 ? 'Exalted in Cancer' : `Own sign in ${jupP.signName}`;
    yogas.push({
      name: 'Hamsa Yoga',
      sanskrit: 'हंस योग',
      planets: ['Jupiter'],
      houses: [jupP.house],
      rule: `Jupiter placed in Kendra House ${jupP.house} in ${dignity}`,
      significance: 'A Pancha Mahapurusha yoga traditionally associated with philosophical elevation, reverence for truth, and spiritual benevolence.'
    });
  }

  // Malavya (Venus)
  if (kendraHouses.includes(venP.house) && [2, 7, 12].includes(venP.signIndex)) {
    const dignity = venP.signIndex === 12 ? 'Exalted in Pisces' : `Own sign in ${venP.signName}`;
    yogas.push({
      name: 'Malavya Yoga',
      sanskrit: 'मालव्य योग',
      planets: ['Venus'],
      houses: [venP.house],
      rule: `Venus placed in Kendra House ${venP.house} in ${dignity}`,
      significance: 'A Pancha Mahapurusha yoga traditionally associated with refined aesthetic gifts, grace, diplomatic elegance, and peace.'
    });
  }

  // Sasa (Saturn)
  if (kendraHouses.includes(satP.house) && [7, 10, 11].includes(satP.signIndex)) {
    const dignity = satP.signIndex === 7 ? 'Exalted in Libra' : `Own sign in ${satP.signName}`;
    yogas.push({
      name: 'Sasa Yoga',
      sanskrit: 'शश योग',
      planets: ['Saturn'],
      houses: [satP.house],
      rule: `Saturn placed in Kendra House ${satP.house} in ${dignity}`,
      significance: 'A Pancha Mahapurusha yoga traditionally associated with endurance, administrative authority, discipline, and strategic patience.'
    });
  }

  // 4. AMALA YOGA
  const isBenefic = (p) => ['Jupiter', 'Venus', 'Mercury'].includes(p.name);
  const h10LagnaBenefics = planets.filter((p) => p.house === 10 && isBenefic(p));
  const moonH10Target = ((moonP.house + 9 - 1) % 12) + 1;
  const h10MoonBenefics = planets.filter((p) => p.house === moonH10Target && isBenefic(p));

  if (h10LagnaBenefics.length > 0 || h10MoonBenefics.length > 0) {
    const triggerBenefics = [...new Set([...h10LagnaBenefics, ...h10MoonBenefics].map((p) => p.name))];
    const refHouses = [];
    if (h10LagnaBenefics.length > 0) refHouses.push('10th from Lagna');
    if (h10MoonBenefics.length > 0) refHouses.push('10th from Moon');

    yogas.push({
      name: 'Amala Yoga',
      sanskrit: 'अमला योग',
      planets: triggerBenefics,
      houses: [10],
      rule: `Natural benefic (${triggerBenefics.join(', ')}) occupying the ${refHouses.join(' and ')}`,
      significance: 'Traditionally associated with spotless public integrity, honorable professional deeds, and enduring civic goodwill.'
    });
  }

  // 5. PARVATA YOGA
  const kendraOccupants = planets.filter((p) => kendraHouses.includes(p.house));
  const hasKendraBenefic = kendraOccupants.some((p) => isBenefic(p));
  const dusthanaHouses = [6, 8];
  const naturalMalefics = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const dusthanaMalefics = planets.filter((p) => dusthanaHouses.includes(p.house) && naturalMalefics.includes(p.name));

  if (hasKendraBenefic && dusthanaMalefics.length === 0) {
    yogas.push({
      name: 'Parvata Yoga',
      sanskrit: 'पर्वत योग',
      planets: kendraOccupants.filter((p) => isBenefic(p)).map((p) => p.name),
      houses: [1, 4, 7, 10],
      rule: 'Benefics present in Kendra houses while 6th and 8th Dusthanas remain unburdened by natural malefics',
      significance: 'Traditionally associated with enduring fortune, stable prosperity, leadership, and renowned structural fortitude like a mountain.'
    });
  }

  // 6. DHANA YOGA
  function getLordOfHouse(hNum) {
    const signIdx = ((lagnaSignIdx + hNum - 2) % 12) + 1;
    return ZODIAC_SIGNS[signIdx - 1].lord;
  }

  const lord1 = getLordOfHouse(1);
  const lord2 = getLordOfHouse(2);
  const lord5 = getLordOfHouse(5);
  const lord9 = getLordOfHouse(9);
  const lord11 = getLordOfHouse(11);

  const dhanaLords = [...new Set([lord1, lord2, lord5, lord9, lord11])];
  const dhanaHouses = [1, 2, 5, 9, 11];

  let detectedDhanaPairs = [];
  for (let i = 0; i < dhanaLords.length; i++) {
    for (let j = i + 1; j < dhanaLords.length; j++) {
      const pA = findP(dhanaLords[i]);
      const pB = findP(dhanaLords[j]);
      if (pA && pB && pA.house === pB.house && dhanaHouses.includes(pA.house)) {
        detectedDhanaPairs.push({
          lords: [pA.name, pB.name],
          house: pA.house
        });
      }
    }
  }

  if (detectedDhanaPairs.length > 0) {
    const pair = detectedDhanaPairs[0];
    yogas.push({
      name: 'Dhana Yoga',
      sanskrit: 'धन योग',
      planets: pair.lords,
      houses: [pair.house],
      rule: `Mutual conjunction of prosperity lords (${pair.lords.join(' & ')}) in auspicious House ${pair.house}`,
      significance: 'Traditionally associated with the capacity to generate material wealth, professional stability, and resourceful abundance.'
    });
  }

  return yogas;
}

export const HOUSES_META = [
  { id: 1, sanskrit: 'Tanu Bhava', name: 'Self & Life Path', desc: 'Physique, vitality, core personality, orientation to life, appearance.', traditionalInterpretation: 'Governs primary character, physical health, aura, and the foundational attitude with which an individual engages the world.' },
  { id: 2, sanskrit: 'Dhana Bhava', name: 'Wealth & Speech', desc: 'Financial accumulation, spoken word, family lineage, values, nutrition.', traditionalInterpretation: 'Governs accumulated financial reserves, tone of voice, truthfulness of expression, and early ancestral heritage.' },
  { id: 3, sanskrit: 'Sahaja Bhava', name: 'Courage & Siblings', desc: 'Willpower, initiative, short travels, manual skills, younger siblings.', traditionalInterpretation: 'Reveals dynamic valor (Parakrama), manual dexterity, athletic or technical pursuits, and courage to initiate change.' },
  { id: 4, sanskrit: 'Sukha Bhava', name: 'Home & Inner Peace', desc: 'Mother, land, domestic peace, vehicles, emotional foundation.', traditionalInterpretation: 'Reflects mental equilibrium, maternal bonds, anchored residential security, and contentment of the heart.' },
  { id: 5, sanskrit: 'Putra Bhava', name: 'Creativity & Intellect', desc: 'Children, past-life merit (Purva Punya), intelligence, creative gifts.', traditionalInterpretation: 'The house of high intellect, philosophical authorship, mantra-siddhi, creative progeny, and spontaneous joy.' },
  { id: 6, sanskrit: 'Ari Bhava', name: 'Obstacles & Service', desc: 'Daily discipline, health vitality, overcoming rivals, healing service.', traditionalInterpretation: 'Depicts the capacity to overcome debt, illness, and competition through consistent daily discipline and humble service.' },
  { id: 7, sanskrit: 'Yuvati Bhava', name: 'Partnership & Union', desc: 'Spouse, business relationships, external contracts, public interaction.', traditionalInterpretation: 'Signifies marital affinity, public mirror, reciprocal covenants, commercial transactions, and external trade.' },
  { id: 8, sanskrit: 'Randhra Bhava', name: 'Transformation & Mysticism', desc: 'Longevity, occult understanding, sudden shifts, unearned wealth, rebirth.', traditionalInterpretation: 'The sanctuary of deep psychic transformation, legacy inheritances, esoteric mysteries, and resilience through rebirth.' },
  { id: 9, sanskrit: 'Dharma Bhava', name: 'Higher Wisdom & Fortune', desc: 'Father, spiritual guides, philosophical expansion, pilgrimage, auspicious fate.', traditionalInterpretation: 'The auspicious house of Bhagya (good fortune), higher guidance, fatherly protection, spiritual pilgrimages, and righteousness.' },
  { id: 10, sanskrit: 'Karma Bhava', name: 'Profession & Prestige', desc: 'Career pinnacle, public standing, legacy, executive power in the world.', traditionalInterpretation: 'The midday zenith representing visible achievements, professional station, worldly influence, and purposeful civic duty.' },
  { id: 11, sanskrit: 'Labha Bhava', name: 'Gains & Aspirations', desc: 'Financial yields, peer networks, high social circles, dreams realized.', traditionalInterpretation: 'Measures the realization of fondest ambitions, monetary expansion from career, elder sibling rapport, and social networks.' },
  { id: 12, sanskrit: 'Vyaya Bhava', name: 'Liberation & Solitude', desc: 'Spiritual detachment (Moksha), sleep, foreign dwellings, inner surrender.', traditionalInterpretation: 'Signifies inward transcendence, solitary contemplation, foreign lands, sleep quality, and spiritual release from karma.' }
];

export function getPlacement(degTotal) {
  const totalDeg = normalizeDeg(degTotal);
  const signIndex = Math.floor(totalDeg / 30);
  const degreeInSign = totalDeg % 30;
  const sign = ZODIAC_SIGNS[signIndex];

  const nakSpan = 360 / 27;
  const nakIndex = Math.floor(totalDeg / nakSpan);
  const nakRemainder = totalDeg % nakSpan;
  const padaSpan = nakSpan / 4;
  const pada = Math.min(4, Math.floor(nakRemainder / padaSpan) + 1);
  const nakshatra = NAKSHATRAS_LIST[nakIndex % 27];

  const degFloor = Math.floor(degreeInSign);
  const minFloor = Math.floor((degreeInSign % 1) * 60);

  return {
    totalDeg,
    signIndex: signIndex + 1,
    signName: sign.name,
    signSanskrit: sign.sanskrit,
    degreeInSign: parseFloat(degreeInSign.toFixed(4)),
    degFormatted: `${degFloor}° ${minFloor < 10 ? '0' + minFloor : minFloor}'`,
    nakshatra: nakshatra.name,
    nakshatraLord: nakshatra.lord,
    nakshatraDeity: nakshatra.deity,
    nakshatraSymbol: nakshatra.symbol,
    pada,
    varna: sign.varna,
    vashya: sign.vashyaType,
    yoni: nakshatra.yoni,
    gana: nakshatra.gana,
    nadi: nakshatra.nadi
  };
}

export function generatePersonalLifeOverview(chart, profileName = 'Seeker') {
  if (!chart || !chart.lagna || !chart.moon || !chart.sun) return null;

  const lagna = chart.lagna;
  const moon = chart.moon;
  const sun = chart.sun;
  const planets = chart.planets || [];
  const houses = chart.houses || [];
  const yogas = chart.yogas || [];
  const dasha = chart.dashaSnapshot || {};

  const findP = (name) => planets.find((p) => p.name.toLowerCase() === name.toLowerCase());
  const venP = findP('Venus');
  const jupP = findP('Jupiter');
  const mercP = findP('Mercury');

  // 1. Core Nature
  const coreNature = {
    title: 'Core Nature & Fundamental Orientation',
    lagnaSummary: `Born with ${lagna.signName} (${lagna.signSanskrit}) Ascendant, your outward vitality and natural vantage point are traditionally characterized by ${
      lagna.signName === 'Aries' ? 'pioneering drive, dynamic initiative, and straightforward action' :
      lagna.signName === 'Taurus' ? 'grounded patience, sensual appreciation, and pragmatic endurance' :
      lagna.signName === 'Gemini' ? 'intellectual curiosity, adaptive communication, and multifaceted versatility' :
      lagna.signName === 'Cancer' ? 'deep intuition, protective empathy, and a strong inner sanctuary' :
      lagna.signName === 'Leo' ? 'natural dignity, radiant leadership presence, and heartfelt generosity' :
      lagna.signName === 'Virgo' ? 'meticulous discernment, craft mastery, and conscientious service' :
      lagna.signName === 'Libra' ? 'diplomatic harmony, aesthetic equilibrium, and relational attunement' :
      lagna.signName === 'Scorpio' ? 'penetrating psychological insight, unwavering resilience, and depth' :
      lagna.signName === 'Sagittarius' ? 'philosophical optimism, love of truthful exploration, and moral enthusiasm' :
      lagna.signName === 'Capricorn' ? 'structural maturity, strategic perseverance, and realistic ambition' :
      lagna.signName === 'Aquarius' ? 'visionary originality, humanitarian perspective, and systemic thinking' :
      'transcendent imagination, compassionate empathy, and quiet inner contemplation'
    }.`,
    triadHarmonization: `Your inner mind (Chandra in ${moon.signName}) brings an emotional flavor of ${moon.signSanskrit} responsiveness, while your core soul purpose (Surya in ${sun.signName} in House ${sun.house}) focuses your vitality on ${
      sun.house === 1 ? 'cultivating authentic selfhood' :
      sun.house === 5 ? 'intellectual creativity and self-expression' :
      sun.house === 9 ? 'higher philosophy and ethical expansion' :
      sun.house === 10 ? 'purposeful civic achievement and public duty' :
      'anchoring personal values and meaningful real-world contribution'
    }.`
  };

  // 2. Personality & Traits
  const personality = {
    title: 'Personality & Psychological Traits',
    temperament: `Traditional Vedic interpretation associates your ${moon.signName} Moon in ${moon.nakshatra} (${moon.gana} Gana) with a ${
      moon.gana === 'Deva' ? 'benevolent, peaceful, and principled temperament' :
      moon.gana === 'Manushya' ? 'balanced, practical, and relationship-oriented nature' :
      'courageous, fiercely independent, and transformative drive'
    }.`,
    tendencies: [
      `Your conscious mind may naturally process situations with ${moon.signName} discernment rather than impulsive overreaction.`,
      `The positioning of the Ascendant lord suggests an instinctive orientation toward stability and self-mastery.`,
      `Vedic astrology traditionally views this combination as favoring thoughtful reflection prior to major life transitions.`
    ]
  };

  // 3. Relationships & Affinity
  const house7 = houses.find((h) => h.houseNumber === 7);
  const relationships = {
    title: 'Relational Disposition & Union',
    overview: `Your 7th Bhava (${house7 ? house7.signName : 'Partnership'}) is traditionally associated with how you mirror yourself in one-on-one bonds and covenants.`,
    themes: `Ruled by ${house7 ? house7.signLord : 'its lord'}, partnerships may traditionally call for mutual respect, intellectual rapport, and shared long-term values. Venus in ${venP ? venP.signName : 'the chart'} suggests that relational fulfillment is often experienced through genuine loyalty and aesthetic or philosophical alignment rather than superficial connection.`,
    guidance: 'Traditional Jyotish regards open, honest communication as the natural harmonizer for any planetary friction in relational houses.'
  };

  // 4. Learning & Work Style
  const house10 = houses.find((h) => h.houseNumber === 10);
  const learningWorkStyle = {
    title: 'Intellectual & Professional Work Style',
    learning: `Mercury in ${mercP ? mercP.signName : 'its sign'} (House ${mercP ? mercP.house : 1}) traditionally indicates an analytical style characterized by ${
      mercP && [3, 6].includes(mercP.signIndex) ? 'structured logical precision and rapid conceptual synthesis' :
      mercP && [4, 8, 12].includes(mercP.signIndex) ? 'intuitive, reflective, and deeply contemplative inquiry' :
      'adaptive, resourceful, and pragmatic problem-solving'
    }.`,
    vocationThemes: `With your 10th House of Karma (${house10 ? house10.signName : 'Profession'}) guided by ${house10 ? house10.signLord : 'its ruler'}, traditional Vedic interpretation highlights tendencies toward roles that value integrity, autonomy, and tangible public contribution.`,
    workEnvironment: 'Thrives best in environments with clear ethical standards, room for self-directed initiative, and opportunities to build lasting outcomes.'
  };

  // 5. Strengths
  const strengthsList = [];
  if (yogas.length > 0) {
    strengthsList.push(`Grounded by verified classical alignments including ${yogas.map((y) => y.name).slice(0, 2).join(' and ')}.`);
  }
  strengthsList.push(`Constitutional fortitude and centered presence derived from ${lagna.signName} Lagna.`);
  strengthsList.push(`Intuitive sensitivity and imaginative depth through ${moon.nakshatra} Moon.`);
  if (jupP && [1, 4, 5, 7, 9, 10].includes(jupP.house)) {
    strengthsList.push(`Benefic guidance and philosophical optimism supported by Jupiter in House ${jupP.house}.`);
  } else {
    strengthsList.push('Natural capacity for patient endurance and learning through life experiences.');
  }

  const strengths = {
    title: 'Recognized Chart Strengths',
    items: strengthsList
  };

  // 6. Growth Areas
  const growthList = [
    'Remaining mindful against overthinking or excessive self-criticism during demanding phases.',
    'Cultivating intentional boundaries to preserve emotional energy in high-stimulus environments.',
    'Balancing dynamic ambition with restorative quiet time and consistent daily routines.'
  ];
  const growthAreas = {
    title: 'Constructive Growth Opportunities',
    items: growthList
  };

  // 7. Current Phase
  const currentPhase = {
    title: 'Current Dasha Phase & Temporal Climate',
    mahadasha: dasha.activeMahadasha || 'Active Period',
    antardasha: dasha.activeAntardasha || 'Sub-period',
    endDate: dasha.endDate || 'Upcoming cycle',
    remaining: `${dasha.remainingMonths || 0} Months, ${dasha.remainingDays || 0} Days remaining`,
    traditionalContext: `In classical Vimshottari interpretation, the ${dasha.activeMahadasha} Mahadasha combined with ${dasha.activeAntardasha} Antardasha traditionally brings themes ruled by ${dasha.activeMahadasha} and ${dasha.activeAntardasha} to the forefront of conscious life experiences.`
  };

  // 8. Nakshatra & Pada Profile
  const nakMeta = NAKSHATRAS_LIST.find((n) => n.name.toLowerCase() === moon.nakshatra?.toLowerCase()) || NAKSHATRAS_LIST[0];
  const nakshatraProfile = {
    title: 'Moon Nakshatra & Pada Profile',
    name: moon.nakshatra,
    pada: moon.pada,
    lord: moon.nakshatraLord,
    deity: moon.nakshatraDeity,
    symbol: moon.nakshatraSymbol,
    themes: nakMeta.themes || 'Pioneering spiritual insight and mental focus.',
    padaSignificance: `Pada ${moon.pada} traditionally refines the lunar impulse toward ${
      moon.pada === 1 ? 'Dharma (righteous purpose and initiative)' :
      moon.pada === 2 ? 'Artha (material stability and grounded practicality)' :
      moon.pada === 3 ? 'Kama (creative aspiration and relational harmony)' :
      'Moksha (inner detachment and spiritual contemplation)'
    }.`
  };

  // 9. Key Chart Themes (Rule-Based Yogas)
  const keyThemes = {
    title: 'Key Structural Chart Themes (Verified Yogas)',
    yogas: yogas.length > 0
      ? yogas.map((y) => ({ name: y.name, significance: y.significance, rule: y.rule }))
      : [
          {
            name: 'Kendra-Trikona Balance',
            significance: 'Standard Parashari house angularity providing balanced life opportunities without prominent extreme combinations.',
            rule: 'Evaluated from natal Lagna coordinates'
          }
        ]
  };

  return {
    profileName,
    coreNature,
    personality,
    relationships,
    learningWorkStyle,
    strengths,
    growthAreas,
    currentPhase,
    nakshatraProfile,
    keyThemes
  };
}

export function computeVedicChart(birthData) {
  const { dob, tob, lat, lon, timezone } = birthData;
  const [yearStr, monthStr, dayStr] = dob.split('-');
  const [hourStr, minStr] = tob.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const localHour = parseInt(hourStr, 10) + parseInt(minStr, 10) / 60;

  const tzOffset = getHistoricalUtcOffset(timezone, dob, tob, lon);
  const utcHour = localHour - tzOffset;

  const jd = toJulianDay(year, month, day, utcHour);
  const ayanamsa = getLahiriAyanamsa(jd);
  const T = (jd - 2451545.0) / 36525.0;

  const ephem = computeMeeusSolarSystem(jd, ayanamsa);

  // Ascendant / Lagna
  let gmst0 = 100.46061837 + 36000.770053608 * T + 0.000387933 * T * T - (T * T * T) / 38710000;
  gmst0 = normalizeDeg(gmst0);
  const gmst = normalizeDeg(gmst0 + 360.985647366 * (utcHour / 24));
  const lmst = normalizeDeg(gmst + lon);
  const ramcRad = lmst * DEG2RAD;
  const epsRad = (23.439291 - 0.0130042 * T) * DEG2RAD;
  const latRad = lat * DEG2RAD;

  const ascY = -Math.cos(ramcRad);
  const ascX = Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
  let tropicalAsc = normalizeDeg(Math.atan2(ascY, ascX) * RAD2DEG);
  const siderealAsc = normalizeDeg(tropicalAsc - ayanamsa);

  const ascPlacement = getPlacement(siderealAsc);
  const lagnaSignIdx = ascPlacement.signIndex;

  function getHouse(planetSignIdx, lagnaIdx) {
    let h = planetSignIdx - lagnaIdx + 1;
    if (h <= 0) h += 12;
    return h;
  }

  const rawPlanets = [
    { name: 'Sun', sanskrit: 'Surya', symbol: '☉', karaka: 'Soul (Atma), father, vital essence, authority', deg: ephem.siderealSun, isRetro: false, traditionalMeaning: 'Governs confidence, core identity, state authority, and inner purpose.' },
    { name: 'Moon', sanskrit: 'Chandra', symbol: '☽', karaka: 'Conscious mind (Manas), mother, emotional baseline, peace', deg: ephem.siderealMoon, isRetro: false, traditionalMeaning: 'Governs psychological comfort, nurturing instinct, intuitive perceptions, and community rapport.' },
    { name: 'Mars', sanskrit: 'Mangala', symbol: '♂', karaka: 'Courage (Parakrama), drive, property, siblings, strategic initiative', deg: ephem.siderealMars, isRetro: false, traditionalMeaning: 'Imparts physical stamina, surgical clarity, ambition, and the strength to confront adversity.' },
    { name: 'Mercury', sanskrit: 'Budha', symbol: '☿', karaka: 'Analytical discernment (Buddhi), trade, speech, computational wit', deg: ephem.siderealMerc, isRetro: false, traditionalMeaning: 'Enhances communication clarity, commercial wit, dexterity, and adaptive learning skills.' },
    { name: 'Jupiter', sanskrit: 'Brihaspati', symbol: '♃', karaka: 'Wisdom (Guru), dharma, expansion, counselors, progeny', deg: ephem.siderealJup, isRetro: false, traditionalMeaning: 'Brings ethical maturity, benevolent growth, devotion to learning, and philosophical balance.' },
    { name: 'Venus', sanskrit: 'Shukra', symbol: '♀', karaka: 'Aesthetic elegance, love, vehicular refinement, sensual joy, diplomacy', deg: ephem.siderealVen, isRetro: false, traditionalMeaning: 'Fosters artistic discernment, devotion, mutual affection, and diplomatic grace.' },
    { name: 'Saturn', sanskrit: 'Shani', symbol: '♄', karaka: 'Discipline, time (Kala), longevity (Ayus), endurance, humble service', deg: ephem.siderealSat, isRetro: false, traditionalMeaning: 'Teaches patient maturity, mastery through delay, organizational grit, and duty.' },
    { name: 'Rahu', sanskrit: 'Rahu', symbol: '☊', karaka: 'Worldly innovation, foreign voyages, eccentric insight, desire', deg: ephem.siderealRahu, isRetro: true, traditionalMeaning: 'Magnifies unconventional hunger for breakthroughs, modern technology, and foreign spheres.' },
    { name: 'Ketu', sanskrit: 'Ketu', symbol: '☋', karaka: 'Detachment, spiritual release (Moksha), subtle intuition, mastery', deg: ephem.siderealKetu, isRetro: true, traditionalMeaning: 'Dissolves attachment to material facades, awakening deep spiritual introspection and mastery.' }
  ];

  const planets = rawPlanets.map((p) => {
    const pl = getPlacement(p.deg);
    const house = getHouse(pl.signIndex, lagnaSignIdx);
    return { ...p, ...pl, house };
  });

  const houses = HOUSES_META.map((meta) => {
    const houseSignIdx = ((lagnaSignIdx + meta.id - 2) % 12) + 1;
    const signObj = ZODIAC_SIGNS[houseSignIdx - 1];
    const occupants = planets.filter((p) => p.house === meta.id);
    return {
      houseNumber: meta.id,
      sanskrit: meta.sanskrit,
      name: meta.name,
      desc: meta.desc,
      traditionalInterpretation: meta.traditionalInterpretation,
      signName: signObj.name,
      signSanskrit: signObj.sanskrit,
      signLord: signObj.lord,
      occupants
    };
  });

  // FIX (technical audit): birthDateObj must represent the true absolute
  // birth instant, independent of the server/browser's own local
  // timezone. The previous line built it via new Date(year, month-1,
  // day, hour, minute), which JS silently interprets in the RUNTIME's
  // local timezone — not the birth location's timezone already resolved
  // above into `jd`/`utcHour`. That made the Dasha mahadasha/antardasha
  // calendar dates (and therefore which one is reported "currently
  // active") shift by up to a day depending on what timezone the server
  // happens to run in, even though jd/ayanamsa/sidereal positions were
  // always correct. Deriving it from the already-correct `jd` (Julian
  // Day epoch: 1970-01-01T00:00:00Z = JD 2440587.5) fixes this without
  // touching any other calculation.
  const birthDateObj = new Date((jd - 2440587.5) * 86400000);
  const dashaSnapshot = computeVimshottariDasha(ephem.siderealMoon, birthDateObj);

  // Deterministic rule-based Yogas
  const yogas = detectRuleBasedYogas(planets, houses, lagnaSignIdx);

  return {
    jd: parseFloat(jd.toFixed(6)),
    utcHour: parseFloat(utcHour.toFixed(4)),
    ayanamsaName: 'Lahiri (Chitra Paksha)',
    ayanamsaDeg: ayanamsa.toFixed(4),
    resolvedUtcOffset: tzOffset,
    lagna: ascPlacement,
    sun: planets.find((p) => p.name === 'Sun'),
    moon: planets.find((p) => p.name === 'Moon'),
    planets,
    houses,
    yogas,
    dashaSnapshot
  };
}

export function computeCurrentTransits(natalLagnaSignIdx) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const decimalHourUTC = now.getUTCHours() + now.getUTCMinutes() / 60;

  const jd = toJulianDay(year, month, day, decimalHourUTC);
  const ayanamsa = getLahiriAyanamsa(jd);
  const ephem = computeMeeusSolarSystem(jd, ayanamsa);

  const transitPlanets = [
    { name: 'Sun', symbol: '☉', deg: ephem.siderealSun },
    { name: 'Moon', symbol: '☽', deg: ephem.siderealMoon },
    { name: 'Mars', symbol: '♂', deg: ephem.siderealMars },
    { name: 'Mercury', symbol: '☿', deg: ephem.siderealMerc },
    { name: 'Jupiter', symbol: '♃', deg: ephem.siderealJup },
    { name: 'Venus', symbol: '♀', deg: ephem.siderealVen },
    { name: 'Saturn', symbol: '♄', deg: ephem.siderealSat },
    { name: 'Rahu', symbol: '☊', deg: ephem.siderealRahu },
    { name: 'Ketu', symbol: '☋', deg: ephem.siderealKetu }
  ].map((p) => {
    const pl = getPlacement(p.deg);
    let natalHouseTransit = pl.signIndex - natalLagnaSignIdx + 1;
    if (natalHouseTransit <= 0) natalHouseTransit += 12;
    return { ...p, ...pl, natalHouseTransit };
  });

  const moonTransit = transitPlanets.find((p) => p.name === 'Moon');
  return {
    transitPlanets,
    currentMoonSign: moonTransit.signName,
    currentMoonNakshatra: moonTransit.nakshatra,
    currentMoonPada: moonTransit.pada,
    ayanamsa: ayanamsa.toFixed(4)
  };
}

export const VARNA_GRADE = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };

export const VASHYA_GRID = {
  Chatushpada: { Chatushpada: 2.0, Manava: 1.0, Jalachara: 1.0, Vanachara: 0.0, Keeta: 1.0 },
  Manava:      { Chatushpada: 1.0, Manava: 2.0, Jalachara: 0.5, Vanachara: 0.0, Keeta: 1.0 },
  Jalachara:   { Chatushpada: 1.0, Manava: 0.5, Jalachara: 2.0, Vanachara: 1.0, Keeta: 1.0 },
  Vanachara:   { Chatushpada: 0.0, Manava: 0.0, Jalachara: 0.0, Vanachara: 2.0, Keeta: 0.0 },
  Keeta:       { Chatushpada: 1.0, Manava: 1.0, Jalachara: 1.0, Vanachara: 0.0, Keeta: 2.0 }
};

export const YONI_MATRIX = {
  Horse:    { Horse: 4, Elephant: 2, Sheep: 2, Serpent: 3, Dog: 2, Cat: 2, Rat: 2, Cow: 1, Buffalo: 0, Tiger: 1, Deer: 3, Monkey: 3, Mongoose: 2, Lion: 1 },
  Elephant: { Horse: 2, Elephant: 4, Sheep: 3, Serpent: 3, Dog: 2, Cat: 2, Rat: 2, Cow: 2, Buffalo: 3, Tiger: 1, Deer: 2, Monkey: 3, Mongoose: 2, Lion: 0 },
  Sheep:    { Horse: 2, Elephant: 3, Sheep: 4, Serpent: 2, Dog: 1, Cat: 2, Rat: 1, Cow: 3, Buffalo: 3, Tiger: 1, Deer: 2, Monkey: 0, Mongoose: 3, Lion: 1 },
  Serpent:  { Horse: 3, Elephant: 3, Sheep: 2, Serpent: 4, Dog: 2, Cat: 1, Rat: 1, Cow: 1, Buffalo: 1, Tiger: 2, Deer: 2, Monkey: 2, Mongoose: 0, Lion: 2 },
  Dog:      { Horse: 2, Elephant: 2, Sheep: 1, Serpent: 2, Dog: 4, Cat: 2, Rat: 1, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 0, Monkey: 2, Mongoose: 1, Lion: 1 },
  Cat:      { Horse: 2, Elephant: 2, Sheep: 2, Serpent: 1, Dog: 2, Cat: 4, Rat: 0, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 2, Monkey: 3, Mongoose: 1, Lion: 1 },
  Rat:      { Horse: 2, Elephant: 2, Sheep: 1, Serpent: 1, Dog: 1, Cat: 0, Rat: 4, Cow: 2, Buffalo: 2, Tiger: 2, Deer: 2, Monkey: 2, Mongoose: 1, Lion: 2 },
  Cow:      { Horse: 1, Elephant: 2, Sheep: 3, Serpent: 1, Dog: 2, Cat: 2, Rat: 2, Cow: 4, Buffalo: 3, Tiger: 0, Deer: 3, Monkey: 2, Mongoose: 2, Lion: 1 },
  Buffalo:  { Horse: 0, Elephant: 3, Sheep: 3, Serpent: 1, Dog: 2, Cat: 2, Rat: 2, Cow: 3, Buffalo: 4, Tiger: 1, Deer: 2, Monkey: 2, Mongoose: 2, Lion: 2 },
  Tiger:    { Horse: 1, Elephant: 1, Sheep: 1, Serpent: 2, Dog: 1, Cat: 1, Rat: 2, Cow: 0, Buffalo: 1, Tiger: 4, Deer: 1, Monkey: 1, Mongoose: 2, Lion: 1 },
  Deer:     { Horse: 3, Elephant: 2, Sheep: 2, Serpent: 2, Dog: 0, Cat: 2, Rat: 2, Cow: 3, Buffalo: 2, Tiger: 1, Deer: 4, Monkey: 2, Mongoose: 2, Lion: 2 },
  Monkey:   { Horse: 3, Elephant: 3, Sheep: 0, Serpent: 2, Dog: 2, Cat: 3, Rat: 2, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 2, Monkey: 4, Mongoose: 3, Lion: 2 },
  Mongoose: { Horse: 2, Elephant: 2, Sheep: 3, Serpent: 0, Dog: 1, Cat: 1, Rat: 1, Cow: 2, Buffalo: 2, Tiger: 2, Deer: 2, Monkey: 3, Mongoose: 4, Lion: 2 },
  Lion:     { Horse: 1, Elephant: 0, Sheep: 1, Serpent: 2, Dog: 1, Cat: 1, Rat: 2, Cow: 1, Buffalo: 2, Tiger: 1, Deer: 2, Monkey: 2, Mongoose: 2, Lion: 4 }
};

export const GRAHA_FRIENDSHIP = {
  Sun:     { friends: ['Moon', 'Mars', 'Jupiter'], neutrals: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon:    { friends: ['Sun', 'Mercury'], neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'], enemies: [] },
  Mars:    { friends: ['Sun', 'Moon', 'Jupiter'], neutrals: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutrals: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutrals: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus:   { friends: ['Mercury', 'Saturn'], neutrals: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn:  { friends: ['Mercury', 'Venus'], neutrals: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] }
};

export function getGrahaRelationship(p1, p2) {
  if (p1 === p2) return 'friend';
  const data = GRAHA_FRIENDSHIP[p1];
  if (!data) return 'neutral';
  if (data.friends.includes(p2)) return 'friend';
  if (data.enemies.includes(p2)) return 'enemy';
  return 'neutral';
}

export function scoreGrahaMaitri(lord1, lord2) {
  if (lord1 === lord2) return 5.0;
  const rel1to2 = getGrahaRelationship(lord1, lord2);
  const rel2to1 = getGrahaRelationship(lord2, lord1);

  if (rel1to2 === 'friend' && rel2to1 === 'friend') return 5.0;
  if ((rel1to2 === 'friend' && rel2to1 === 'neutral') || (rel1to2 === 'neutral' && rel2to1 === 'friend')) return 4.0;
  if (rel1to2 === 'neutral' && rel2to1 === 'neutral') return 3.0;
  if ((rel1to2 === 'friend' && rel2to1 === 'enemy') || (rel1to2 === 'enemy' && rel2to1 === 'friend')) return 1.0;
  if ((rel1to2 === 'neutral' && rel2to1 === 'enemy') || (rel1to2 === 'enemy' && rel2to1 === 'neutral')) return 0.5;
  return 0.0;
}

export const GANA_MATRIX = {
  Deva: { Deva: 6.0, Manushya: 5.0, Rakshasa: 1.0 },
  Manushya: { Deva: 6.0, Manushya: 6.0, Rakshasa: 0.0 },
  Rakshasa: { Deva: 0.0, Manushya: 0.0, Rakshasa: 6.0 }
};

export function calculateAshtakoota(chart1, chart2) {
  if (!chart1?.moon || !chart2?.moon) {
    return {
      totalScore: 0,
      maxScore: 36,
      percentage: 0,
      factors: [],
      verdict: 'Insufficient Moon placement data for Ashtakoota calculation'
    };
  }

  const nak1 = NAKSHATRAS_LIST.find((n) => n.name.toLowerCase() === chart1.moon.nakshatra?.toLowerCase()) || NAKSHATRAS_LIST[0];
  const nak2 = NAKSHATRAS_LIST.find((n) => n.name.toLowerCase() === chart2.moon.nakshatra?.toLowerCase()) || NAKSHATRAS_LIST[1];
  const sign1 = ZODIAC_SIGNS[(chart1.moon.signIndex || 1) - 1];
  const sign2 = ZODIAC_SIGNS[(chart2.moon.signIndex || 1) - 1];

  let totalScore = 0;
  const factors = [];

  // Varna
  const vGrade1 = VARNA_GRADE[sign1.varna] || 1;
  const vGrade2 = VARNA_GRADE[sign2.varna] || 1;
  const varnaScore = vGrade1 >= vGrade2 ? 1 : 0;
  totalScore += varnaScore;
  factors.push({
    name: 'Varna Koota',
    max: 1,
    score: varnaScore,
    desc: `Spiritual ego alignment (${sign1.varna} [${sign1.name}] vs ${sign2.varna} [${sign2.name}]).`
  });

  // Vashya
  const vashyaType1 = sign1.vashyaType;
  const vashyaType2 = sign2.vashyaType;
  let vashyaScore = 1.0;
  if (sign1.id === sign2.id) {
    vashyaScore = 2.0;
  } else if (VASHYA_GRID[vashyaType1] && VASHYA_GRID[vashyaType1][vashyaType2] !== undefined) {
    vashyaScore = VASHYA_GRID[vashyaType1][vashyaType2];
  }
  totalScore += vashyaScore;
  factors.push({
    name: 'Vashya Koota',
    max: 2,
    score: vashyaScore,
    desc: `Mutual magnetic authority (${vashyaType1} and ${vashyaType2}).`
  });

  // Tara
  const count1to2 = ((nak2.id - nak1.id + 27) % 9);
  const count2to1 = ((nak1.id - nak2.id + 27) % 9);
  const auspiciousRem = [2, 4, 6, 8, 0];
  const t1 = auspiciousRem.includes(count1to2) ? 1.5 : 0.0;
  const t2 = auspiciousRem.includes(count2to1) ? 1.5 : 0.0;
  const taraScore = t1 + t2;
  totalScore += taraScore;
  factors.push({
    name: 'Tara Koota',
    max: 3,
    score: taraScore,
    desc: `Health & longevity via cyclic Navatara (${t1}/1.5 & ${t2}/1.5).`
  });

  // Yoni
  const animal1 = nak1.yoni;
  const animal2 = nak2.yoni;
  let yoniScore = 2;
  if (YONI_MATRIX[animal1] && YONI_MATRIX[animal1][animal2] !== undefined) {
    yoniScore = YONI_MATRIX[animal1][animal2];
  } else if (animal1 === animal2) {
    yoniScore = 4;
  }
  totalScore += yoniScore;
  factors.push({
    name: 'Yoni Koota',
    max: 4,
    score: yoniScore,
    desc: `Biological intimacy between ${animal1} and ${animal2}.`
  });

  // Graha Maitri
  const lord1 = sign1.lord;
  const lord2 = sign2.lord;
  const grahaMaitriScore = scoreGrahaMaitri(lord1, lord2);
  totalScore += grahaMaitriScore;
  factors.push({
    name: 'Graha Maitri Koota',
    max: 5,
    score: grahaMaitriScore,
    desc: `Mental rapport between Rashi lords (${lord1} and ${lord2}).`
  });

  // Gana
  const gana1 = nak1.gana;
  const gana2 = nak2.gana;
  let ganaScore = 0;
  if (gana1 === gana2) {
    ganaScore = 6.0;
  } else if (GANA_MATRIX[gana1] && GANA_MATRIX[gana1][gana2] !== undefined) {
    ganaScore = GANA_MATRIX[gana1][gana2];
  }
  totalScore += ganaScore;
  factors.push({
    name: 'Gana Koota',
    max: 6,
    score: ganaScore,
    desc: `Temperamental affinity (${gana1} and ${gana2}).`
  });

  // Bhakoot
  const signDistance = ((sign2.id - sign1.id + 12) % 12) + 1;
  let bhakootScore = 7;
  let bhakootNote = 'Auspicious Rashi disposition.';
  const isDoshic = [2, 12, 5, 9, 6, 8].includes(signDistance);
  if (isDoshic) {
    const sameLord = lord1 === lord2;
    const mutualFriends =
      getGrahaRelationship(lord1, lord2) === 'friend' &&
      getGrahaRelationship(lord2, lord1) === 'friend';

    if (sameLord || mutualFriends) {
      bhakootScore = 7;
      bhakootNote = `Dosha cancelled (Parihara) by ${sameLord ? 'identical lord' : 'mutual natural friends'}.`;
    } else {
      bhakootScore = 0;
      bhakootNote = 'Inauspicious disposition without planetary cancellation.';
    }
  }
  totalScore += bhakootScore;
  factors.push({
    name: 'Bhakoot Koota',
    max: 7,
    score: bhakootScore,
    desc: `Emotional welfare (Rashi distance ${signDistance}/12). ${bhakootNote}`
  });

  // Nadi
  let nadiScore = 8;
  let nadiNote = 'Different Nadis ensure bio-energetic balance.';
  if (nak1.nadi === nak2.nadi) {
    nadiScore = 0;
    nadiNote = `Identical Nadi (${nak1.nadi}) causes classical Nadi Dosha (0/8).`;
  }
  totalScore += nadiScore;
  factors.push({
    name: 'Nadi Koota',
    max: 8,
    score: nadiScore,
    desc: `Bio-energetic constitution (${nak1.nadi} vs ${nak2.nadi}). ${nadiNote}`
  });

  const roundedTotal = Math.round(totalScore * 10) / 10;
  const percentage = Math.round((roundedTotal / 36) * 100);

  return {
    totalScore: roundedTotal,
    maxScore: 36,
    percentage,
    factors,
    verdict:
      roundedTotal >= 28
        ? 'Utkrishta (Outstanding Classical Compatibility)'
        : roundedTotal >= 21
        ? 'Madhyama-Shubha (Very Good Compatibility)'
        : roundedTotal >= 18
        ? 'Sadharana (Acceptable with Mutual Understanding)'
        : 'Varjya (Requires Remedial Attention & Astrological Counsel)'
  };
}
