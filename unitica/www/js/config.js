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

// App Store (iPhone): Apple has no base plans, every period is its own auto-renewable subscription. Both sit in ONE subscription
// group (App Store Connect › Subscriptions), so a user can only hold one of them and switches between them there.
export const IOS_PRODUCTS = { monthly: `${PACKAGE}.adfree.monthly`, yearly: `${PACKAGE}.adfree.yearly` };
/** the App Store's subscription list; the sheet opens Apple's own in-app page first (billing.manage) */
export const MANAGE_URL_IOS = 'https://apps.apple.com/account/subscriptions';
/** Apple's standard licence agreement: App Review (3.1.2) wants it linked next to the subscription, with the privacy policy */
export const EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
