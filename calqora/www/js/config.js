// Fixed facts about the app: who publishes it, its version, and the ad-free subscription. See README.md ("Reklam ve üyelik").
// The ads themselves (Google AdMob: banner + interstitial, and their rules) are reklam.js; the unit ids reklam-kimlik.js.

// Poyraz Workshop's Calqora. `version` is the same as android/app/build.gradle › versionName and package.json (test/uygulama.test.mjs).
export const APP = {
  id: 'com.poyrazworkshop.calqora',
  version: '1.1.0',
  developer: 'Poyraz Workshop',
  email: 'mahmuttari@gmail.com',
  privacyUrl: 'https://mahmuttari.github.io/Lispler/calqora/gizlilik.html',
  // GeoTerva stays only as a plain line on the About screen (the owner's brand; it was the full-screen house ad of 1.0.0)
  geoterva: { name: 'GeoTerva', url: 'https://geoterva.com' },
};

// Google Play subscription: ONE subscription product with two base plans (Play Console > Monetize > Subscriptions).
// The prices are set in the Play Console ($0.99 / month, $9.99 / year); the app shows the store's own (localised) prices and uses these only in the
// desktop-browser mock (billing.js), never inside the app.
export const SUBSCRIPTION = {
  productId: 'adfree',
  plans: ['monthly', 'yearly'],   // base plan ids
  fallbackPrice: { monthly: '$0.99', yearly: '$9.99' },
  fallbackAmount: { monthly: 0.99, yearly: 9.99 },
  // Google Play's page for this one subscription (cancel, change the plan, update the payment method)
  manageUrl: 'https://play.google.com/store/account/subscriptions?sku=adfree&package=com.poyrazworkshop.calqora',
};

// App Store (iPhone): Apple has no base plans, every period is its own auto-renewable subscription. Both sit in ONE subscription group
// (App Store Connect > Subscriptions), so a user holds only one of them and switches between them there.
export const IOS = {
  products: { monthly: 'com.poyrazworkshop.calqora.adfree.monthly', yearly: 'com.poyrazworkshop.calqora.adfree.yearly' },
  // the App Store's subscription list; the app opens Apple's own in-app page first (billing.js > manage)
  manageUrl: 'https://apps.apple.com/account/subscriptions',
  // Apple's standard licence agreement: App Review (3.1.2) wants it linked next to the subscription, with the privacy policy
  eulaUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
};
