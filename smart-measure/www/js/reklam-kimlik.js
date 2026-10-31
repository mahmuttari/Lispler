// araclar/kimlik.mjs yazar (android/gradle.properties ve ios/admob.properties → ADMOB_BANNER_ID, ADMOB_INTERSTITIAL_ID);
// elle düzenlenmez. Platforma göre: android / ios.
export const REKLAM_KIMLIK = {
  android: { banner: 'ca-app-pub-2417242373034448/9192206063', gecis: 'ca-app-pub-2417242373034448/7966754303' },
  ios: { banner: 'ca-app-pub-3940256099942544/2435281174', gecis: 'ca-app-pub-3940256099942544/4411468910' },
};
// Google'ın test kimlikleri: hata ayıklama derlemesi her zaman bunları kullanır.
export const TEST_KIMLIK = {
  android: { banner: 'ca-app-pub-3940256099942544/9214589741', gecis: 'ca-app-pub-3940256099942544/1033173712' },
  ios: { banner: 'ca-app-pub-3940256099942544/2435281174', gecis: 'ca-app-pub-3940256099942544/4411468910' },
};
