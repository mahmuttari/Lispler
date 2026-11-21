// Number and coordinate text as the languages write it, and what people type into the coordinate fields.
import { loadLang } from '../../www/js/i18n.js';
import { degText, kmText, coordText, parseCoord } from '../../www/js/fmt.js';

export async function run({ ok }) {
  await loadLang('tr');
  ok(degText(151.62) === '151,6°' && kmText(2405.07) === '2.405 km' && coordText(41.0082, 28.9784) === '41,0082° K, 28,9784° D', 'Turkish: comma decimals, dot thousands, K/D', degText(151.62) + ' ' + kmText(2405.07) + ' ' + coordText(41.0082, 28.9784));
  ok(coordText(-33.8688, -70.6) === '33,8688° G, 70,6000° B', 'Turkish: south and west', coordText(-33.8688, -70.6));
  await loadLang('en');
  ok(degText(151.62) === '151.6°' && kmText(12345.6) === '12,346 km' && coordText(41.0082, -28.9784) === '41.0082° N, 28.9784° W', 'English', degText(151.62) + ' ' + kmText(12345.6) + ' ' + coordText(41.0082, -28.9784));
  await loadLang('fr');
  ok(kmText(2405.07) === '2 405 km' && degText(0.04) === '0,0°', 'French: narrow space before the thousands', kmText(2405.07));
  await loadLang('ru');
  ok(kmText(2405.07).startsWith('2 405') && coordText(55.75, 37.62).includes('с. ш.') && coordText(55.75, 37.62).includes('в. д.'), 'Russian', coordText(55.75, 37.62));
  await loadLang('ar');
  ok(/^[0-9.,° ]+/.test(degText(151.62)) && coordText(21.4, 39.8).includes('ش') && coordText(21.4, 39.8).includes('ق'), 'Arabic keeps Western digits and uses Arabic hemisphere letters', coordText(21.4, 39.8));
  await loadLang('ja');
  ok(coordText(35.68, 139.65).includes('北') && coordText(35.68, 139.65).includes('東'), 'Japanese letters');
  await loadLang('en');

  const p = (s, a) => parseCoord(s, a);
  ok(p('41.0082', 'lat') === 41.0082 && p('41,0082', 'lat') === 41.0082 && p(' -28.97 ', 'lon') === -28.97 && p('41.0082°', 'lat') === 41.0082, 'parseCoord: plain numbers, comma, degree sign');
  ok(p('41.0082 N', 'lat') === 41.0082 && p('33.87 S', 'lat') === -33.87 && p('70.6 W', 'lon') === -70.6 && p('28.97 E', 'lon') === 28.97 && p('N 41.0', 'lat') === 41, 'parseCoord: hemisphere letters');
  ok(p('33.87 G', 'lat') === -33.87 && p('70.6 B', 'lon') === -70.6 && p('28.9 D', 'lon') === 28.9 && p('41.0 K', 'lat') === 41, 'parseCoord: Turkish letters (K G D B)');
  ok(p('-33.87 S', 'lat') === -33.87 && p('-70.6 W', 'lon') === -70.6 && p('+41.0 N', 'lat') === 41 && p('−33.87', 'lat') === -33.87 && p('−70.6 B', 'lon') === -70.6, 'parseCoord: a minus together with a hemisphere letter is not a double negative; the typographic minus counts');
  ok(Number.isNaN(p('28.9 E', 'lat')) && Number.isNaN(p('41 N', 'lon')) && Number.isNaN(p('28.9 D', 'lat')) && Number.isNaN(p('41 K', 'lon')), 'parseCoord: a letter of the other axis is refused');
  ok(Number.isNaN(p('', 'lat')) && Number.isNaN(p('abc', 'lat')) && Number.isNaN(p('91', 'lat')) && Number.isNaN(p('-181', 'lon')) && Number.isNaN(p('1.2.3', 'lat')) && p('90', 'lat') === 90 && p('-180', 'lon') === -180, 'parseCoord: rejects nonsense and out-of-range values');
}
