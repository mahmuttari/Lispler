// OTOMATİK: node araclar/kimlik.mjs yazar, kaynak android/gradle.properties ve ios/admob.properties (elle düzenleme).
// AdMob reklam birimi kimlikleri, platforma göre. Hata ayıklama derlemesinde (Capacitor.DEBUG) reklam.js bunların yerine
// Google'ın test birimlerini ister (isTesting).
export const REKLAM_KIMLIK = {
  android: { banner: 'ca-app-pub-2417242373034448/8355882522', gecis: 'ca-app-pub-2417242373034448/7042800854' },
  ios: { banner: 'ca-app-pub-3940256099942544/2435281174', gecis: 'ca-app-pub-3940256099942544/4411468910' },
};
