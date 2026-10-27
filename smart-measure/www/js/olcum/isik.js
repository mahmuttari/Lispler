// Işık ölçer sınıflandırmaları (özgün uygulamanın eşikleri, lux). Saf işlevler.

/** Genel düzey: çok karanlık < 25 ≤ loş < 125 ≤ normal < 350 ≤ aydınlık < 750 ≤ çok aydınlık */
export function level(lux) {
  if (lux < 25) return 'very_dark';
  if (lux < 125) return 'dim';
  if (lux < 350) return 'normal';
  if (lux < 750) return 'bright';
  return 'very_bright';
}

/** Çalışma için öneri (ana sayfa): fazla loş < 100 ≤ biraz az < 300 ≤ uygun < 1000 ≤ çok aydınlık */
export function advice(lux) {
  if (lux < 100) return 'too_dim';
  if (lux < 300) return 'dim';
  if (lux < 1000) return 'suitable';
  return 'too_bright';
}

/** Ofis kartı: loş < 300 ≤ uygun < 1000 ≤ çok aydınlık */
export function office(lux) {
  if (lux < 300) return 'dim';
  if (lux < 1000) return 'ok';
  return 'bright';
}

/** Bitkiler kartı: karanlık < 50 ≤ düşük < 250 ≤ orta < 1000 ≤ parlak */
export function plants(lux) {
  if (lux < 50) return 'dark';
  if (lux < 250) return 'low';
  if (lux < 1000) return 'medium';
  return 'bright';
}

/** Göstergedeki konum (0…1): ölçek doğrusal değil, özgün uygulamadaki dayanak noktaları arasında doğrusal. */
const KNOTS = [[0, 0], [50, 0.23], [200, 0.49], [500, 0.72], [1000, 1]];
export const GAUGE_TICKS = [0, 50, 200, 500, 1000];
export function gauge(lux) {
  if (!(lux > 0)) return 0;
  for (let i = 1; i < KNOTS.length; i++) {
    const [x0, y0] = KNOTS[i - 1], [x1, y1] = KNOTS[i];
    if (lux <= x1) return y0 + (y1 - y0) * (lux - x0) / (x1 - x0);
  }
  return 1;
}

/** Gösterge bölgelerinin sınırları (düzey eşikleri, 0…1). */
export const GAUGE_MARKS = [
  { id: 'very_dark', from: 0, to: gauge(25) },
  { id: 'dim', from: gauge(25), to: gauge(125) },
  { id: 'normal', from: gauge(125), to: gauge(350) },
  { id: 'bright', from: gauge(350), to: gauge(750) },
  { id: 'very_bright', from: gauge(750), to: 1 },
];
