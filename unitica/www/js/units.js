// Unit tables and the conversion engine. Pure data and pure functions: no DOM, no storage, no locale.
//
// Every linear unit has f = how many BASE units one of it is (the base is the SI unit named in `base`).
// Non-linear units (temperature scales, slope) carry to(v) -> base and from(base) -> v instead of f.
// Every factor below is derived from the exact definitions in the constants, never typed as a rounded decimal:
//   the inch, foot, yard, mile and the avoirdupois pound are defined exactly in SI;
//   kgf, lbf, slug, mH2O ... follow from the standard gravity G (9.80665 m/s2);
//   the calorie and the BTU are the International Table ones (IT), the horsepower is the mechanical one (550 ft.lbf/s).

const G = 9.80665;
const IN = 0.0254, FT = 0.3048, YD = 0.9144, MI = 1609.344, NMI = 1852;
const LB = 0.45359237;
const LBF = LB * G;                                  // pound-force, N
const SLUG = LBF / FT;                               // kg
const IN2 = IN * IN, FT2 = FT * FT, YD2 = YD * YD, MI2 = MI * MI;
const IN3 = IN2 * IN, FT3 = FT2 * FT, YD3 = YD2 * YD;
const GAL = 0.003785411784;                          // US liquid gallon, m3
const GAL_UK = 0.00454609;                           // imperial gallon, m3
const CAL = 4.1868, KCAL = 4186.8;                   // IT calorie, J
const BTU = 1055.05585262;                           // IT BTU, J
const HP = 550 * FT * LBF;                           // mechanical horsepower, W
const MMHG = 133.322387415;                          // conventional millimetre of mercury, Pa
const DAY = 86400, HOUR = 3600;

const u = (id, sym, tr, en, f) => ({ id, sym, tr, en: en || tr, f });
const nl = (id, sym, tr, en, to, from) => ({ id, sym, tr, en: en || tr, to, from });

const DEG = Math.PI / 180;
// The slope units: a slope only exists for angles between -90 and +90 degrees (outside, tan() repeats itself: NaN, shown as a dash).
// tan() blows up at 90 degrees, 1/tan() at 0 degrees; those ends are infinite, not a huge float.
const slopePct = nl('pct', '%', 'Eğim yüzdesi', 'Slope percent',
  v => Math.atan(v / 100) / DEG,
  d => { if (Math.abs(d) > 90) return NaN; const p = Math.tan(d * DEG) * 100; return Math.abs(p) > 1e14 ? (p < 0 ? -Infinity : Infinity) : p; });
const slopeRatio = nl('ratio', '1:n', 'Eğim oranı 1:n (düşey:yatay)', 'Slope ratio 1:n (vertical:horizontal)',
  n => (n === 0 ? 90 : Math.atan(1 / n) / DEG),
  d => { if (Math.abs(d) > 90) return NaN; const t = Math.tan(d * DEG); if (t === 0) return Infinity; const n = 1 / t; return Math.abs(n) < 1e-12 ? 0 : n; });

/** group ids in display order (the four families of the first chat) */
export const GROUPS = ['core', 'fluid', 'heat', 'mass'];

/** the categories the home screen shows first (4 x 2 grid) */
export const FEATURED = ['length', 'mass', 'volume', 'pressure', 'temperature', 'energy', 'flow', 'power'];

export const CATEGORIES = [
  // ---------------------------------------------------------------- core: geotechnical / civil
  { id: 'length', group: 'core', icon: 'ruler', tr: 'Uzunluk', en: 'Length', base: 'm', def: ['m', 'ft'], units: [
    u('um', 'µm', 'mikrometre', 'micrometre', 1e-6), u('mm', 'mm', 'milimetre', 'millimetre', 1e-3), u('cm', 'cm', 'santimetre', 'centimetre', 1e-2),
    u('m', 'm', 'metre', 'metre', 1), u('km', 'km', 'kilometre', 'kilometre', 1e3),
    u('in', 'in', 'inç', 'inch', IN), u('ft', 'ft', 'feet', 'foot', FT), u('yd', 'yd', 'yarda', 'yard', YD),
    u('mi', 'mi', 'mil', 'mile', MI), u('nmi', 'nmi', 'deniz mili', 'nautical mile', NMI)] },
  { id: 'area', group: 'core', icon: 'square-dashed', tr: 'Alan', en: 'Area', base: 'm²', def: ['m2', 'ft2'], units: [
    u('mm2', 'mm²', 'milimetrekare', 'square millimetre', 1e-6), u('cm2', 'cm²', 'santimetrekare', 'square centimetre', 1e-4),
    u('m2', 'm²', 'metrekare', 'square metre', 1), u('km2', 'km²', 'kilometrekare', 'square kilometre', 1e6),
    u('are', 'ar', 'ar', 'are', 100), u('donum', 'dönüm', 'dönüm (1000 m²)', 'dönüm (1000 m²)', 1000), u('ha', 'ha', 'hektar', 'hectare', 1e4),
    u('in2', 'in²', 'inç kare', 'square inch', IN2), u('ft2', 'ft²', 'fit kare', 'square foot', FT2), u('yd2', 'yd²', 'yarda kare', 'square yard', YD2),
    u('acre', 'ac', 'akre', 'acre', 43560 * FT2), u('mi2', 'mi²', 'mil kare', 'square mile', MI2)] },
  { id: 'volume', group: 'core', icon: 'box', tr: 'Hacim', en: 'Volume', base: 'm³', def: ['m3', 'L'], units: [
    u('mm3', 'mm³', 'milimetreküp', 'cubic millimetre', 1e-9), u('cm3', 'cm³', 'santimetreküp', 'cubic centimetre', 1e-6), u('mL', 'mL', 'mililitre', 'millilitre', 1e-6),
    u('L', 'L', 'litre', 'litre', 1e-3), u('m3', 'm³', 'metreküp', 'cubic metre', 1),
    u('in3', 'in³', 'inç küp', 'cubic inch', IN3), u('ft3', 'ft³', 'fit küp', 'cubic foot', FT3), u('yd3', 'yd³', 'yarda küp', 'cubic yard', YD3),
    u('qt', 'qt', 'kuart (ABD)', 'quart (US)', GAL / 4), u('gal', 'gal', 'galon (ABD)', 'gallon (US)', GAL), u('galuk', 'gal UK', 'galon (İngiliz)', 'gallon (imperial)', GAL_UK),
    u('bbl', 'bbl', 'varil (petrol)', 'barrel (oil)', 42 * GAL), u('acft', 'ac·ft', 'akre-fit', 'acre-foot', 43560 * FT3)] },
  { id: 'force', group: 'core', icon: 'arrow-big-down', tr: 'Kuvvet', en: 'Force', base: 'N', def: ['kN', 'tf'], units: [
    u('N', 'N', 'newton', 'newton', 1), u('daN', 'daN', 'dekanewton', 'decanewton', 10), u('kN', 'kN', 'kilonewton', 'kilonewton', 1e3), u('MN', 'MN', 'meganewton', 'meganewton', 1e6),
    u('dyn', 'dyn', 'dyn', 'dyne', 1e-5),
    u('gf', 'gf', 'gram-kuvvet', 'gram-force', G / 1000), u('kgf', 'kgf', 'kilogram-kuvvet', 'kilogram-force', G), u('tf', 'tf', 'ton-kuvvet', 'tonne-force', G * 1000),
    u('lbf', 'lbf', 'pound-kuvvet', 'pound-force', LBF), u('kip', 'kip', 'kip (1000 lbf)', 'kip (1000 lbf)', 1000 * LBF), u('tonf', 'tonf', 'kısa ton-kuvvet (ABD)', 'short ton-force (US)', 2000 * LBF)] },
  { id: 'pressure', group: 'core', icon: 'gauge', tr: 'Basınç / Gerilme', en: 'Pressure / Stress', base: 'Pa', def: ['kPa', 'kgf_cm2'], units: [
    u('Pa', 'Pa', 'paskal', 'pascal', 1), u('hPa', 'hPa', 'hektopaskal', 'hectopascal', 100), u('kPa', 'kPa', 'kilopaskal', 'kilopascal', 1e3),
    u('MPa', 'MPa', 'megapaskal', 'megapascal', 1e6), u('GPa', 'GPa', 'gigapaskal', 'gigapascal', 1e9),
    u('kN_m2', 'kN/m²', 'kilonewton/metrekare', 'kilonewton/square metre', 1e3), u('N_mm2', 'N/mm²', 'newton/milimetrekare', 'newton/square millimetre', 1e6),
    u('mbar', 'mbar', 'milibar', 'millibar', 100), u('bar', 'bar', 'bar', 'bar', 1e5), u('atm', 'atm', 'atmosfer', 'atmosphere', 101325),
    u('kgf_m2', 'kgf/m²', 'kilogram-kuvvet/metrekare', 'kilogram-force/square metre', G), u('kgf_cm2', 'kgf/cm²', 'kilogram-kuvvet/santimetrekare', 'kilogram-force/square centimetre', G * 1e4),
    u('kgf_mm2', 'kgf/mm²', 'kilogram-kuvvet/milimetrekare', 'kilogram-force/square millimetre', G * 1e6), u('tf_m2', 'tf/m²', 'ton-kuvvet/metrekare', 'tonne-force/square metre', G * 1000),
    u('psf', 'psf', 'pound-kuvvet/fitkare', 'pound-force/square foot', LBF / FT2), u('psi', 'psi', 'pound-kuvvet/inçkare', 'pound-force/square inch', LBF / IN2),
    u('ksf', 'ksf', 'kip/fitkare', 'kip/square foot', 1000 * LBF / FT2), u('ksi', 'ksi', 'kip/inçkare', 'kip/square inch', 1000 * LBF / IN2),
    u('tsf', 'tsf', 'kısa ton-kuvvet/fitkare', 'short ton-force/square foot', 2000 * LBF / FT2),
    u('mmHg', 'mmHg', 'milimetre cıva', 'millimetre of mercury', MMHG), u('inHg', 'inHg', 'inç cıva', 'inch of mercury', MMHG * 25.4),
    u('mmH2O', 'mmH₂O', 'milimetre su sütunu', 'millimetre of water', G), u('mH2O', 'mH₂O', 'metre su sütunu', 'metre of water', G * 1000), u('ftH2O', 'ftH₂O', 'fit su sütunu', 'foot of water', FT * G * 1000)] },
  { id: 'unitWeight', group: 'core', icon: 'package', tr: 'Birim hacim ağırlık', en: 'Unit weight', base: 'N/m³', def: ['kN_m3', 'tf_m3'], units: [
    u('N_m3', 'N/m³', 'newton/metreküp', 'newton/cubic metre', 1), u('kN_m3', 'kN/m³', 'kilonewton/metreküp', 'kilonewton/cubic metre', 1e3),
    u('kgf_m3', 'kgf/m³', 'kilogram-kuvvet/metreküp', 'kilogram-force/cubic metre', G), u('tf_m3', 'tf/m³', 'ton-kuvvet/metreküp', 'tonne-force/cubic metre', G * 1000),
    u('gf_cm3', 'gf/cm³', 'gram-kuvvet/santimetreküp', 'gram-force/cubic centimetre', G * 1000), u('kN_cm3', 'kN/cm³', 'kilonewton/santimetreküp', 'kilonewton/cubic centimetre', 1e9),
    u('lbf_ft3', 'lbf/ft³ (pcf)', 'pound-kuvvet/fitküp', 'pound-force/cubic foot', LBF / FT3), u('lbf_in3', 'lbf/in³', 'pound-kuvvet/inçküp', 'pound-force/cubic inch', LBF / IN3),
    u('kip_ft3', 'kip/ft³', 'kip/fitküp', 'kip/cubic foot', 1000 * LBF / FT3)] },
  { id: 'density', group: 'core', icon: 'droplets', tr: 'Yoğunluk', en: 'Density', base: 'kg/m³', def: ['t_m3', 'kg_m3'], units: [
    u('kg_m3', 'kg/m³', 'kilogram/metreküp', 'kilogram/cubic metre', 1), u('g_L', 'g/L', 'gram/litre', 'gram/litre', 1), u('kg_L', 'kg/L', 'kilogram/litre', 'kilogram/litre', 1e3),
    u('g_cm3', 'g/cm³', 'gram/santimetreküp', 'gram/cubic centimetre', 1e3), u('t_m3', 't/m³', 'ton/metreküp', 'tonne/cubic metre', 1e3), u('Mg_m3', 'Mg/m³', 'megagram/metreküp', 'megagram/cubic metre', 1e3),
    u('lb_ft3', 'lb/ft³', 'pound/fitküp', 'pound/cubic foot', LB / FT3), u('lb_in3', 'lb/in³', 'pound/inçküp', 'pound/cubic inch', LB / IN3),
    u('lb_gal', 'lb/gal', 'pound/galon (ABD)', 'pound/gallon (US)', LB / GAL), u('slug_ft3', 'slug/ft³', 'slug/fitküp', 'slug/cubic foot', SLUG / FT3)] },
  { id: 'moment', group: 'core', icon: 'rotate-cw', tr: 'Moment', en: 'Moment', base: 'N·m', def: ['kNm', 'tfm'], units: [
    u('Nmm', 'N·mm', 'newton·milimetre', 'newton·millimetre', 1e-3), u('Nm', 'N·m', 'newton·metre', 'newton·metre', 1), u('kNcm', 'kN·cm', 'kilonewton·santimetre', 'kilonewton·centimetre', 10),
    u('kNm', 'kN·m', 'kilonewton·metre', 'kilonewton·metre', 1e3), u('MNm', 'MN·m', 'meganewton·metre', 'meganewton·metre', 1e6),
    u('kgfcm', 'kgf·cm', 'kilogram-kuvvet·santimetre', 'kilogram-force·centimetre', G / 100), u('kgfm', 'kgf·m', 'kilogram-kuvvet·metre', 'kilogram-force·metre', G),
    u('tfm', 'tf·m', 'ton-kuvvet·metre', 'tonne-force·metre', G * 1000),
    u('lbfin', 'lbf·in', 'pound-kuvvet·inç', 'pound-force·inch', LBF * IN), u('lbfft', 'lbf·ft', 'pound-kuvvet·fit', 'pound-force·foot', LBF * FT),
    u('kipin', 'kip·in', 'kip·inç', 'kip·inch', 1000 * LBF * IN), u('kipft', 'kip·ft', 'kip·fit', 'kip·foot', 1000 * LBF * FT)] },
  { id: 'angle', group: 'core', icon: 'triangle-right', tr: 'Açı / Eğim', en: 'Angle / Slope', base: '°', def: ['deg', 'rad'], units: [
    u('deg', '°', 'derece', 'degree', 1), u('rad', 'rad', 'radyan', 'radian', 1 / DEG), u('grad', 'gon', 'grad (gon)', 'gradian (gon)', 0.9),
    u('arcmin', '′', 'dakika', 'arcminute', 1 / 60), u('arcsec', '″', 'saniye', 'arcsecond', 1 / 3600), u('turn', 'turn', 'tur (devir)', 'turn', 360),
    slopePct, slopeRatio] },

  // ---------------------------------------------------------------- fluid / hydraulics
  { id: 'flow', group: 'fluid', icon: 'waves', tr: 'Debi', en: 'Flow rate', base: 'm³/s', def: ['m3_s', 'L_s'], units: [
    u('m3_s', 'm³/s', 'metreküp/saniye', 'cubic metre/second', 1), u('m3_min', 'm³/min', 'metreküp/dakika', 'cubic metre/minute', 1 / 60), u('m3_h', 'm³/h', 'metreküp/saat', 'cubic metre/hour', 1 / HOUR),
    u('m3_day', 'm³/day', 'metreküp/gün', 'cubic metre/day', 1 / DAY), u('L_s', 'L/s', 'litre/saniye', 'litre/second', 1e-3), u('L_min', 'L/min', 'litre/dakika', 'litre/minute', 1e-3 / 60),
    u('L_h', 'L/h', 'litre/saat', 'litre/hour', 1e-3 / HOUR), u('ft3_s', 'ft³/s (cfs)', 'fitküp/saniye', 'cubic foot/second', FT3), u('ft3_min', 'ft³/min (cfm)', 'fitküp/dakika', 'cubic foot/minute', FT3 / 60),
    u('gpm', 'gpm', 'galon (ABD)/dakika', 'gallon (US)/minute', GAL / 60), u('gph', 'gph', 'galon (ABD)/saat', 'gallon (US)/hour', GAL / HOUR), u('mgd', 'MGD', 'milyon galon (ABD)/gün', 'million gallons (US)/day', 1e6 * GAL / DAY)] },
  { id: 'velocity', group: 'fluid', icon: 'wind', tr: 'Hız', en: 'Velocity', base: 'm/s', def: ['m_s', 'km_h'], units: [
    u('mm_s', 'mm/s', 'milimetre/saniye', 'millimetre/second', 1e-3), u('cm_s', 'cm/s', 'santimetre/saniye', 'centimetre/second', 1e-2), u('m_s', 'm/s', 'metre/saniye', 'metre/second', 1),
    u('m_min', 'm/min', 'metre/dakika', 'metre/minute', 1 / 60), u('km_h', 'km/h', 'kilometre/saat', 'kilometre/hour', 1 / 3.6),
    u('in_s', 'in/s', 'inç/saniye', 'inch/second', IN), u('ft_s', 'ft/s', 'fit/saniye', 'foot/second', FT), u('ft_min', 'ft/min', 'fit/dakika', 'foot/minute', FT / 60),
    u('mph', 'mph', 'mil/saat', 'mile/hour', MI / HOUR), u('kn', 'kn', 'knot (deniz mili/saat)', 'knot (nautical mile/hour)', NMI / HOUR)] },
  { id: 'accel', group: 'fluid', icon: 'rocket', tr: 'İvme', en: 'Acceleration', base: 'm/s²', def: ['m_s2', 'g'], units: [
    u('mm_s2', 'mm/s²', 'milimetre/saniyekare', 'millimetre/second squared', 1e-3), u('cm_s2', 'cm/s² (gal)', 'santimetre/saniyekare (gal)', 'centimetre/second squared (gal)', 1e-2),
    u('m_s2', 'm/s²', 'metre/saniyekare', 'metre/second squared', 1), u('mgal', 'mgal', 'miligal', 'milligal', 1e-5), u('g', 'g', 'standart yer çekimi ivmesi', 'standard gravity', G),
    u('in_s2', 'in/s²', 'inç/saniyekare', 'inch/second squared', IN), u('ft_s2', 'ft/s²', 'fit/saniyekare', 'foot/second squared', FT)] },
  { id: 'dynVisc', group: 'fluid', icon: 'droplet', tr: 'Dinamik viskozite', en: 'Dynamic viscosity', base: 'Pa·s', def: ['Pas', 'cP'], units: [
    u('Pas', 'Pa·s', 'paskal·saniye', 'pascal·second', 1), u('mPas', 'mPa·s', 'milipaskal·saniye', 'millipascal·second', 1e-3), u('cP', 'cP', 'santipuaz', 'centipoise', 1e-3), u('P', 'P', 'puaz', 'poise', 0.1),
    u('kgfs_m2', 'kgf·s/m²', 'kilogram-kuvvet·saniye/metrekare', 'kilogram-force·second/square metre', G), u('lb_fts', 'lb/(ft·s)', 'pound/(fit·saniye)', 'pound/(foot·second)', LB / FT),
    u('lbfs_ft2', 'lbf·s/ft²', 'pound-kuvvet·saniye/fitkare', 'pound-force·second/square foot', LBF / FT2), u('lbfs_in2', 'lbf·s/in²', 'pound-kuvvet·saniye/inçkare', 'pound-force·second/square inch', LBF / IN2)] },
  { id: 'kinVisc', group: 'fluid', icon: 'pipette', tr: 'Kinematik viskozite', en: 'Kinematic viscosity', base: 'm²/s', def: ['mm2_s', 'm2_s'], units: [
    u('m2_s', 'm²/s', 'metrekare/saniye', 'square metre/second', 1), u('cm2_s', 'cm²/s (St)', 'santimetrekare/saniye (stokes)', 'square centimetre/second (stokes)', 1e-4),
    u('mm2_s', 'mm²/s (cSt)', 'milimetrekare/saniye (santistokes)', 'square millimetre/second (centistokes)', 1e-6), u('m2_h', 'm²/h', 'metrekare/saat', 'square metre/hour', 1 / HOUR),
    u('ft2_s', 'ft²/s', 'fitkare/saniye', 'square foot/second', FT2), u('in2_s', 'in²/s', 'inçkare/saniye', 'square inch/second', IN2)] },
  { id: 'permeability', group: 'fluid', icon: 'funnel', tr: 'Geçirgenlik (k)', en: 'Hydraulic conductivity (k)', base: 'm/s', def: ['cm_s', 'm_s'], units: [
    u('um_s', 'µm/s', 'mikrometre/saniye', 'micrometre/second', 1e-6), u('mm_s', 'mm/s', 'milimetre/saniye', 'millimetre/second', 1e-3), u('cm_s', 'cm/s', 'santimetre/saniye', 'centimetre/second', 1e-2),
    u('m_s', 'm/s', 'metre/saniye', 'metre/second', 1), u('m_h', 'm/h', 'metre/saat', 'metre/hour', 1 / HOUR), u('m_day', 'm/day', 'metre/gün', 'metre/day', 1 / DAY),
    u('ft_s', 'ft/s', 'fit/saniye', 'foot/second', FT), u('ft_day', 'ft/day', 'fit/gün', 'foot/day', FT / DAY), u('in_h', 'in/h', 'inç/saat', 'inch/hour', IN / HOUR),
    u('gpd_ft2', 'gal/day/ft²', 'galon (ABD)/gün/fitkare', 'gallon (US)/day/square foot', GAL / (FT2 * DAY))] },

  // ---------------------------------------------------------------- heat / energy / power
  { id: 'temperature', group: 'heat', icon: 'thermometer', tr: 'Sıcaklık', en: 'Temperature', base: 'K', def: ['C', 'F'], units: [
    nl('C', '°C', 'santigrat derece', 'degree Celsius', v => v + 273.15, k => k - 273.15),
    nl('F', '°F', 'fahrenhayt derece', 'degree Fahrenheit', v => (v - 32) * 5 / 9 + 273.15, k => (k - 273.15) * 9 / 5 + 32),
    nl('K', 'K', 'kelvin', 'kelvin', v => v, k => k),
    nl('Ra', '°R', 'rankine derece', 'degree Rankine', v => v * 5 / 9, k => k * 9 / 5)] },
  { id: 'energy', group: 'heat', icon: 'zap', tr: 'Enerji', en: 'Energy', base: 'J', def: ['kJ', 'kcal'], units: [
    u('J', 'J', 'joule', 'joule', 1), u('kJ', 'kJ', 'kilojoule', 'kilojoule', 1e3), u('MJ', 'MJ', 'megajoule', 'megajoule', 1e6), u('GJ', 'GJ', 'gigajoule', 'gigajoule', 1e9),
    u('Wh', 'Wh', 'watt-saat', 'watt-hour', HOUR), u('kWh', 'kWh', 'kilowatt-saat', 'kilowatt-hour', 3.6e6), u('MWh', 'MWh', 'megawatt-saat', 'megawatt-hour', 3.6e9),
    u('cal', 'cal', 'kalori (IT)', 'calorie (IT)', CAL), u('kcal', 'kcal', 'kilokalori (IT)', 'kilocalorie (IT)', KCAL), u('BTU', 'BTU', 'BTU (IT)', 'BTU (IT)', BTU),
    u('ftlbf', 'ft·lbf', 'fit·pound-kuvvet', 'foot·pound-force', FT * LBF), u('kgfm', 'kgf·m', 'kilogram-kuvvet·metre', 'kilogram-force·metre', G), u('hph', 'hp·h', 'beygir gücü-saat', 'horsepower-hour', HP * HOUR),
    u('erg', 'erg', 'erg', 'erg', 1e-7)] },
  { id: 'power', group: 'heat', icon: 'settings', tr: 'Güç', en: 'Power', base: 'W', def: ['kW', 'hp'], units: [
    u('W', 'W', 'watt', 'watt', 1), u('kW', 'kW', 'kilowatt', 'kilowatt', 1e3), u('MW', 'MW', 'megawatt', 'megawatt', 1e6), u('GW', 'GW', 'gigawatt', 'gigawatt', 1e9),
    u('hp', 'hp', 'beygir gücü (HP, 550 ft·lbf/s)', 'horsepower (hp, 550 ft·lbf/s)', HP), u('PS', 'PS', 'metrik beygir gücü (BG, PS)', 'metric horsepower (PS)', 75 * G),
    u('kgfm_s', 'kgf·m/s', 'kilogram-kuvvet·metre/saniye', 'kilogram-force·metre/second', G), u('ftlbf_s', 'ft·lbf/s', 'fit·pound-kuvvet/saniye', 'foot·pound-force/second', FT * LBF),
    u('kcal_h', 'kcal/h', 'kilokalori/saat', 'kilocalorie/hour', KCAL / HOUR), u('BTU_h', 'BTU/h', 'BTU/saat', 'BTU/hour', BTU / HOUR), u('TR', 'TR', 'soğutma tonu', 'ton of refrigeration', 12000 * BTU / HOUR)] },
  { id: 'conductivity', group: 'heat', icon: 'flame', tr: 'Isı iletim katsayısı', en: 'Thermal conductivity', base: 'W/(m·K)', def: ['W_mK', 'kcal_hmC'], units: [
    u('W_mK', 'W/(m·K)', 'watt/(metre·kelvin)', 'watt/(metre·kelvin)', 1), u('kW_mK', 'kW/(m·K)', 'kilowatt/(metre·kelvin)', 'kilowatt/(metre·kelvin)', 1e3), u('W_cmK', 'W/(cm·K)', 'watt/(santimetre·kelvin)', 'watt/(centimetre·kelvin)', 100),
    u('kcal_hmC', 'kcal/(h·m·°C)', 'kilokalori/(saat·metre·°C)', 'kilocalorie/(hour·metre·°C)', KCAL / HOUR), u('cal_scmC', 'cal/(s·cm·°C)', 'kalori/(saniye·santimetre·°C)', 'calorie/(second·centimetre·°C)', CAL * 100),
    u('BTU_hftF', 'BTU/(h·ft·°F)', 'BTU/(saat·fit·°F)', 'BTU/(hour·foot·°F)', BTU / (HOUR * FT * 5 / 9)), u('BTUin_hft2F', 'BTU·in/(h·ft²·°F)', 'BTU·inç/(saat·fitkare·°F)', 'BTU·inch/(hour·square foot·°F)', BTU * IN / (HOUR * FT2 * 5 / 9))] },
  { id: 'specificHeat', group: 'heat', icon: 'flask-conical', tr: 'Özgül ısı', en: 'Specific heat', base: 'J/(kg·K)', def: ['kJ_kgK', 'kcal_kgC'], units: [
    u('J_kgK', 'J/(kg·K)', 'joule/(kilogram·kelvin)', 'joule/(kilogram·kelvin)', 1), u('J_gK', 'J/(g·K)', 'joule/(gram·kelvin)', 'joule/(gram·kelvin)', 1e3), u('kJ_kgK', 'kJ/(kg·K)', 'kilojoule/(kilogram·kelvin)', 'kilojoule/(kilogram·kelvin)', 1e3),
    u('kcal_kgC', 'kcal/(kg·°C)', 'kilokalori/(kilogram·°C)', 'kilocalorie/(kilogram·°C)', KCAL), u('BTU_lbF', 'BTU/(lb·°F)', 'BTU/(pound·°F)', 'BTU/(pound·°F)', BTU / (LB * 5 / 9))] },

  // ---------------------------------------------------------------- mass and inertia
  { id: 'mass', group: 'mass', icon: 'weight', tr: 'Kütle', en: 'Mass', base: 'kg', def: ['kg', 'lb'], units: [
    u('mg', 'mg', 'miligram', 'milligram', 1e-6), u('g', 'g', 'gram', 'gram', 1e-3), u('kg', 'kg', 'kilogram', 'kilogram', 1), u('t', 't', 'ton (metrik)', 'tonne (metric)', 1e3),
    u('oz', 'oz', 'ons', 'ounce', LB / 16), u('lb', 'lb', 'pound', 'pound', LB), u('ston', 'sh tn', 'kısa ton (ABD)', 'short ton (US)', 2000 * LB), u('lton', 'lg tn', 'uzun ton (İngiliz)', 'long ton (UK)', 2240 * LB),
    u('slug', 'slug', 'slug', 'slug', SLUG)] },
  { id: 'areaInertia', group: 'mass', icon: 'shapes', tr: 'Atalet momenti (kesit)', en: 'Area moment of inertia', base: 'm⁴', def: ['cm4', 'mm4'], units: [
    u('mm4', 'mm⁴', 'milimetre⁴', 'millimetre⁴', 1e-12), u('cm4', 'cm⁴', 'santimetre⁴', 'centimetre⁴', 1e-8), u('m4', 'm⁴', 'metre⁴', 'metre⁴', 1),
    u('in4', 'in⁴', 'inç⁴', 'inch⁴', IN2 * IN2), u('ft4', 'ft⁴', 'fit⁴', 'foot⁴', FT2 * FT2)] },
  { id: 'sectionModulus', group: 'mass', icon: 'square', tr: 'Kesit modülü', en: 'Section modulus', base: 'm³', def: ['cm3', 'mm3'], units: [
    u('mm3', 'mm³', 'milimetre³', 'millimetre³', 1e-9), u('cm3', 'cm³', 'santimetre³', 'centimetre³', 1e-6), u('m3', 'm³', 'metre³', 'metre³', 1),
    u('in3', 'in³', 'inç³', 'inch³', IN3), u('ft3', 'ft³', 'fit³', 'foot³', FT3)] },
  { id: 'flexRigidity', group: 'mass', icon: 'spline', tr: 'Eğilme rijitliği (EI)', en: 'Flexural rigidity (EI)', base: 'N·m²', def: ['kNm2', 'tfm2'], units: [
    u('kNcm2', 'kN·cm²', 'kilonewton·santimetre²', 'kilonewton·centimetre²', 0.1), u('Nm2', 'N·m²', 'newton·metre²', 'newton·metre²', 1), u('kNm2', 'kN·m²', 'kilonewton·metre²', 'kilonewton·metre²', 1e3),
    u('MNm2', 'MN·m²', 'meganewton·metre²', 'meganewton·metre²', 1e6), u('kgfcm2', 'kgf·cm²', 'kilogram-kuvvet·santimetre²', 'kilogram-force·centimetre²', G * 1e-4),
    u('kgfm2', 'kgf·m²', 'kilogram-kuvvet·metre²', 'kilogram-force·metre²', G), u('tfm2', 'tf·m²', 'ton-kuvvet·metre²', 'tonne-force·metre²', G * 1000),
    u('lbfin2', 'lbf·in²', 'pound-kuvvet·inç²', 'pound-force·inch²', LBF * IN2), u('lbfft2', 'lbf·ft²', 'pound-kuvvet·fit²', 'pound-force·foot²', LBF * FT2),
    u('kipin2', 'kip·in²', 'kip·inç²', 'kip·inch²', 1000 * LBF * IN2), u('kipft2', 'kip·ft²', 'kip·fit²', 'kip·foot²', 1000 * LBF * FT2)] },
  { id: 'forcePerLength', group: 'mass', icon: 'chevrons-up-down', tr: 'Çizgisel yük / Yay sabiti', en: 'Line load / Spring constant', base: 'N/m', def: ['kN_m', 'tf_m'], units: [
    u('N_mm', 'N/mm', 'newton/milimetre', 'newton/millimetre', 1e3), u('N_m', 'N/m', 'newton/metre', 'newton/metre', 1), u('kN_m', 'kN/m', 'kilonewton/metre', 'kilonewton/metre', 1e3),
    u('kN_cm', 'kN/cm', 'kilonewton/santimetre', 'kilonewton/centimetre', 1e5), u('MN_m', 'MN/m', 'meganewton/metre', 'meganewton/metre', 1e6),
    u('kgf_m', 'kgf/m', 'kilogram-kuvvet/metre', 'kilogram-force/metre', G), u('kgf_cm', 'kgf/cm', 'kilogram-kuvvet/santimetre', 'kilogram-force/centimetre', G * 100), u('tf_m', 'tf/m', 'ton-kuvvet/metre', 'tonne-force/metre', G * 1000),
    u('lbf_in', 'lbf/in', 'pound-kuvvet/inç', 'pound-force/inch', LBF / IN), u('lbf_ft', 'lbf/ft', 'pound-kuvvet/fit', 'pound-force/foot', LBF / FT),
    u('kip_in', 'kip/in', 'kip/inç', 'kip/inch', 1000 * LBF / IN), u('kip_ft', 'kip/ft', 'kip/fit', 'kip/foot', 1000 * LBF / FT)] },
  { id: 'massInertia', group: 'mass', icon: 'orbit', tr: 'Kütle atalet momenti', en: 'Mass moment of inertia', base: 'kg·m²', def: ['kgm2', 'lbft2'], units: [
    u('gcm2', 'g·cm²', 'gram·santimetre²', 'gram·centimetre²', 1e-7), u('kgm2', 'kg·m²', 'kilogram·metre²', 'kilogram·metre²', 1), u('tm2', 't·m²', 'ton·metre²', 'tonne·metre²', 1e3),
    u('lbin2', 'lb·in²', 'pound·inç²', 'pound·inch²', LB * IN2), u('lbft2', 'lb·ft²', 'pound·fit²', 'pound·foot²', LB * FT2), u('slugft2', 'slug·ft²', 'slug·fit²', 'slug·foot²', SLUG * FT2)] },
];

const byId = new Map(CATEGORIES.map(c => [c.id, c]));
for (const c of CATEGORIES) c.byId = new Map(c.units.map(x => [x.id, x]));

export const category = id => byId.get(id) || null;
export const unitOf = (cat, id) => cat.byId.get(id) || null;

/** a number with the 1e-16 noise of a division removed (15 significant digits survive a round trip through double) */
const clean = x => (x === 0 || !Number.isFinite(x) ? x + 0 : Number(x.toPrecision(15)));

export const toBase = (unit, v) => (unit.to ? unit.to(v) : v * unit.f);
export const fromBase = (unit, b) => (unit.from ? unit.from(b) : b / unit.f);

/** v given in `from` -> the same quantity in `to` (both unit objects of ONE category) */
export function convert(from, to, v) {
  if (from === to) return v;
  if (!from.to && !to.from) return clean(v * from.f / to.f);
  return clean(fromBase(to, toBase(from, v)));
}

/** every unit of the category with the value converted into it (order of the table) */
export const convertAll = (cat, from, v) => cat.units.map(unit => ({ unit, value: convert(from, unit, v) }));

/** language independent text a unit is found by: symbol, ids and both names, folded (see foldText) */
export function foldText(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/²/g, '2').replace(/³/g, '3').replace(/⁴/g, '4').replace(/[·.]/g, '')
    .replace(/µ/g, 'u').replace(/₂/g, '2');
}

// The symbols above are the international ones (SI: h, min, d; turn; PS). Turkish writes the time units as sa, dk, gün, the turn as tur and the metric horsepower as BG.
const trSymbol = s => s.replace(/\bmin\b/g, 'dk').replace(/\bh\b/g, 'sa').replace(/\bday\b/g, 'gün').replace(/^turn$/, 'tur').replace(/^PS$/, 'PS / BG');

for (const c of CATEGORIES) {
  c.hay = foldText([c.tr, c.en, c.id].join(' '));
  for (const x of c.units) {
    x.symTr = trSymbol(x.sym);
    x.hay = foldText([x.sym, x.symTr, x.id, x.tr, x.en].join(' '));
  }
}

/**
 * Search: the query is split on blanks, every part must be found in the haystack (symbols, ids, Turkish and English names).
 * `extra(cat | unit)` may add more text to look in - the names in the language of the screen (see i18n.searchText).
 * -> [{ cat, unit|null }] a category hit (unit null) or a unit hit; a category whose NAME matches is listed alone (its units follow only when they match too)
 */
export function search(query, limit = 40, extra = null) {
  const parts = foldText(query).split(/\s+/).filter(Boolean);
  if (!parts.length) return [];
  const out = [];
  const found = (hay, thing) => { const h = extra ? hay + ' ' + extra(thing) : hay; return parts.every(p => h.includes(p)); };
  for (const cat of CATEGORIES) {
    if (found(cat.hay, cat)) out.push({ cat, unit: null });
    for (const unit of cat.units) if (found(unit.hay, unit)) out.push({ cat, unit });
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}
