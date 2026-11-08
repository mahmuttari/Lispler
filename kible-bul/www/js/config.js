// Fixed settings of the app: the ad-free membership, the map, the compass, the About page.
// (The ads of the free version are Google AdMob: js/reklam.js; their unit ids js/reklam-kimlik.js.)

// The About page: developer, contact and privacy policy (GitHub Pages of the Lispler repository)
export const ABOUT = {
  developer: 'Poyraz Workshop',
  email: 'mahmuttari@gmail.com',
  privacyUrl: 'https://mahmuttari.github.io/Lispler/kible-bul/gizlilik.html',
};


// Google Play subscription: ONE subscription product with two base plans (Play Console > Monetize > Subscriptions).
// The prices are set in the Play Console ($0.99 / month, $9.99 / year); the app shows the store's own (localised) prices and uses these only while they are not loaded.
export const SUBSCRIPTION = {
  productId: 'adfree',
  plans: ['monthly', 'yearly'],   // base plan ids
  fallbackPrice: { monthly: '$0.99', yearly: '$9.99' },
  fallbackAmount: { monthly: 0.99, yearly: 9.99 },
};

// The satellite picture of the map: NASA GIBS "Blue Marble" (public domain, no key). Zoom 8 is its finest level.
export const MAP = {
  tiles: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
  maxZoom: 8,
};

// The street map of the mosque screen: OpenStreetMap's standard tiles (the app shows the credit; light use only - if that ever stops being enough, change this address
// to another tile service)
export const STREET_MAP = { tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 19 };

// The phone points at the Qibla when its heading is within ALIGN_DEG degrees of it; once it does, it keeps doing so until it is more than ALIGN_LEAVE_DEG away
// (so that a heading that trembles at the limit does not make the picture flicker and the phone buzz again and again)
export const ALIGN_DEG = 3, ALIGN_LEAVE_DEG = 5;

// The compass is taken as silent when the sensor has not reported for this long
export const STALE_MS = 15000;
