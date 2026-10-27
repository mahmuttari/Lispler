// Sayı ve birim biçimleri (kamerayla ölçüm metrik ya da İngiliz birimi kullanır; cetvelin kendi birimleri vardır).

const LOCALE = { tr: 'tr-TR', en: 'en-US' };
const cache = new Map();

/** Dile göre ondalık ayırıcıyla sabit basamaklı sayı (tr: 1,23 · en: 1.23). Binlik ayırıcı yok. */
export function num(v, digits = 0, lang = 'en') {
  const key = `${lang}:${digits}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE[lang] || 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false });
    cache.set(key, f);
  }
  const s = f.format(Number(Number(v).toFixed(digits)) === 0 ? 0 : v); // −0,0 yazılmasın
  return s.replace('-', '−');
}

/** Uzunluk (m) → metin. Metrik: 1 m altı santimetre, üstü 2 ondalık metre. İngiliz: 12 inç altı inç, üstü ft + in. */
export function length(m, units = 'metric', lang = 'en') {
  if (!Number.isFinite(m)) return '—';
  if (units === 'imperial') {
    const inches = m / 0.0254;
    if (Math.abs(inches) < 12) return `${num(inches, inches < 10 ? 1 : 0, lang)} in`;
    let ft = Math.floor(inches / 12), inch = Math.round(inches - ft * 12);
    if (inch === 12) { ft += 1; inch = 0; }
    return `${ft} ft ${inch} in`;
  }
  if (Math.abs(m) < 1) return `${num(m * 100, 0, lang)} cm`;
  return `${num(m, 2, lang)} m`;
}

/** Belirsizlik (m): en az 1 cm ya da 0,5 in gösterilir. */
export function sigma(m, units = 'metric', lang = 'en') {
  if (units === 'imperial') {
    const inches = Math.max(0.5, m / 0.0254);
    return inches < 12 ? `${num(inches, inches < 10 ? 1 : 0, lang)} in` : length(m, units, lang);
  }
  const cm = Math.max(1, m * 100);
  return cm < 100 ? `${num(cm, 0, lang)} cm` : `${num(m, 2, lang)} m`;
}

/** Telefon yüksekliği girişi: metrik 1,40 m · İngiliz 4 ft 7 in. */
export function phoneHeight(m, units = 'metric', lang = 'en') {
  if (units === 'imperial') return length(m, units, lang);
  return `${num(m, 2, lang)} m`;
}
