// Fixed facts of the Play edition (Poyraz Workshop). Pure data: the tests (test/*.test.mjs) import this file in Node.

/** the Android package (android/app/build.gradle › applicationId) */
export const PACKAGE = 'com.poyrazworkshop.unitica';

export const DEVELOPER = 'Poyraz Workshop';
export const EMAIL = 'mahmuttari@gmail.com';
export const PRIVACY_URL = 'https://mahmuttari.github.io/Lispler/unitica/gizlilik.html';
/** the developer's own site: a plain line on the About sheet, not an ad */
export const GEOTERVA_URL = 'https://geoterva.com';

// Google Play subscription: ONE subscription product with two base plans (Play Console › Monetize › Subscriptions; magaza/fiyatlandirma.md).
// The app shows the store's own localised price (priceString). The fallback prices are used ONLY by the desktop-browser mock (billing.js).
export const SUBSCRIPTION = {
  productId: 'adfree',
  plans: ['yearly', 'monthly'],          // base plan ids, in the order the sheet shows them
  fallbackPrice: { monthly: '$0.99', yearly: '$9.99' },
  fallbackAmount: { monthly: 0.99, yearly: 9.99 },
};

/** "Manage subscription": Google Play's page for this one subscription */
export const MANAGE_URL = `https://play.google.com/store/account/subscriptions?sku=${SUBSCRIPTION.productId}&package=${PACKAGE}`;
