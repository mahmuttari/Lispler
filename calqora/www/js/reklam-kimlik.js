// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: android/gradle.properties ve ios/admob.properties → node araclar/kimlik.mjs
// Android: Gerçek AdMob kimlikleri (yayıncı 2417242373034448).
// iPhone: Şimdilik Google'ın TEST kimlikleri (gerçekleri AdMob'da oluşturulunca docs/ios-yayin.md §1 adım 4).
// Hata ayıklama derlemesi (Capacitor.DEBUG) her zaman TEST_KIMLIK'i kullanır (reklam.js).
export const REKLAM_KIMLIK = {
  android: { uygulama: 'ca-app-pub-2417242373034448~5444532749', banner: 'ca-app-pub-2417242373034448/9133777578', gecis: 'ca-app-pub-2417242373034448/1592917647' },
  ios: { uygulama: 'ca-app-pub-3940256099942544~1458002511', banner: 'ca-app-pub-3940256099942544/2435281174', gecis: 'ca-app-pub-3940256099942544/4411468910' },
};
export const TEST_KIMLIK = {
  android: { uygulama: 'ca-app-pub-3940256099942544~3347511713', banner: 'ca-app-pub-3940256099942544/9214589741', gecis: 'ca-app-pub-3940256099942544/1033173712' },
  ios: { uygulama: 'ca-app-pub-3940256099942544~1458002511', banner: 'ca-app-pub-3940256099942544/2435281174', gecis: 'ca-app-pub-3940256099942544/4411468910' },
};
