// Unit conversion. Every unit has `f` (its size in the category's base unit) or, for temperature, `to` / `from` (base = kelvin).
// s: symbol shown on the key. The names are in lang/<code>.js (units.<category id>[index]), in the order of the units here.
const U = (s, f) => ({ s, f });

export const CATEGORIES = [
  { id: 'length', base: 'm', units: [
    U('m', 1), U('km', 1000), U('cm', 0.01), U('mm', 0.001),
    U('µm', 1e-6), U('nm', 1e-9), U('Å', 1e-10),
    U('in', 0.0254), U('ft', 0.3048), U('yd', 0.9144), U('mi', 1609.344),
    U('nmi', 1852), U('au', 149597870700), U('ly', 9460730472580800)] },
  { id: 'area', base: 'm²', units: [
    U('m²', 1), U('km²', 1e6), U('cm²', 1e-4), U('mm²', 1e-6),
    U('ha', 1e4), U('daa', 1000), U('in²', 0.00064516), U('ft²', 0.09290304),
    U('yd²', 0.83612736), U('ac', 4046.8564224), U('mi²', 2589988.110336)] },
  { id: 'volume', base: 'm³', units: [
    U('m³', 1), U('L', 1e-3), U('mL', 1e-6), U('cm³', 1e-6),
    U('in³', 1.6387064e-5), U('ft³', 0.028316846592), U('yd³', 0.764554857984),
    U('gal', 3.785411784e-3), U('qt', 9.46352946e-4), U('pt', 4.73176473e-4),
    U('cup', 2.365882365e-4), U('fl oz', 2.95735295625e-5), U('imp gal', 4.54609e-3),
    U('bbl', 0.158987294928)] },
  { id: 'mass', base: 'kg', units: [
    U('kg', 1), U('g', 1e-3), U('mg', 1e-6), U('µg', 1e-9),
    U('t', 1000), U('lb', 0.45359237), U('oz', 0.028349523125), U('st', 6.35029318),
    U('sh tn', 907.18474), U('lg tn', 1016.0469088), U('ct', 2e-4)] },
  { id: 'density', base: 'kg/m³', units: [
    U('kg/m³', 1), U('g/cm³', 1000), U('g/L', 1), U('g/mL', 1000), U('t/m³', 1000),
    U('lb/ft³', 16.01846337396), U('lb/in³', 27679.9047102)] },
  { id: 'time', base: 's', units: [
    U('s', 1), U('ms', 1e-3), U('µs', 1e-6), U('ns', 1e-9),
    U('min', 60), U('h', 3600), U('d', 86400), U('wk', 604800),
    U('mo', 2592000), U('yr', 31557600)] },
  { id: 'speed', base: 'm/s', units: [
    U('m/s', 1), U('km/h', 1 / 3.6), U('mph', 0.44704),
    U('kn', 1852 / 3600), U('ft/s', 0.3048), U('cm/s', 0.01),
    U('Mach', 340.294)] },
  { id: 'force', base: 'N', units: [
    U('N', 1), U('kN', 1e3), U('MN', 1e6), U('kgf', 9.80665),
    U('tf', 9806.65), U('lbf', 4.4482216152605), U('kip', 4448.2216152605), U('dyn', 1e-5)] },
  { id: 'pressure', base: 'Pa', units: [
    U('Pa', 1), U('kPa', 1e3), U('MPa', 1e6), U('GPa', 1e9),
    U('bar', 1e5), U('mbar', 100), U('atm', 101325), U('kgf/cm²', 98066.5),
    U('tf/m²', 9806.65), U('mmHg', 133.322387415), U('inHg', 3386.389), U('mH₂O', 9806.65),
    U('psi', 6894.757293168), U('ksf', 47880.25898)] },
  { id: 'energy', base: 'J', units: [
    U('J', 1), U('kJ', 1e3), U('MJ', 1e6), U('cal', 4.184), U('kcal', 4184),
    U('Wh', 3600), U('kWh', 3.6e6), U('eV', 1.602176634e-19),
    U('BTU', 1055.05585262), U('ft·lbf', 1.3558179483314), U('erg', 1e-7)] },
  { id: 'power', base: 'W', units: [
    U('W', 1), U('kW', 1e3), U('MW', 1e6), U('hp', 745.69987158227),
    U('PS', 735.49875), U('BTU/h', 0.29307107017), U('kcal/h', 1.162222222)] },
  { id: 'temperature', base: 'K', units: [
    { s: '°C', to: x => x + 273.15, from: k => k - 273.15 },
    { s: '°F', to: x => (x - 32) * 5 / 9 + 273.15, from: k => (k - 273.15) * 9 / 5 + 32 },
    { s: 'K', to: x => x, from: k => k },
    { s: '°R', to: x => x * 5 / 9, from: k => k * 9 / 5 }] },
  { id: 'angle', base: 'rad', units: [
    U('°', Math.PI / 180), U('rad', 1), U('grad', Math.PI / 200),
    U('′', Math.PI / 10800), U('″', Math.PI / 648000), U('rev', 2 * Math.PI)] },
  { id: 'frequency', base: 'Hz', units: [
    U('Hz', 1), U('kHz', 1e3), U('MHz', 1e6), U('GHz', 1e9),
    U('rpm', 1 / 60), U('rad/s', 1 / (2 * Math.PI))] },
  { id: 'data', base: 'B', units: [
    U('bit', 0.125), U('B', 1), U('kB', 1e3), U('MB', 1e6), U('GB', 1e9), U('TB', 1e12),
    U('KiB', 1024), U('MiB', 1048576), U('GiB', 1073741824), U('TiB', 1099511627776)] },
];

export const toBase = (u, x) => u.to ? u.to(x) : x * u.f;
export const fromBase = (u, b) => u.from ? u.from(b) : b / u.f;

export function convert(x, from, to) {
  const r = fromBase(to, toBase(from, x));
  // 1 ft -> in is 12.000000000000002 in floating point; the machine's 15 digits are enough
  return Number(r.toPrecision(15));
}
