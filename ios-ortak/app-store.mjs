#!/usr/bin/env node
/*
 * App Store metinleri: Play mağaza metinlerinden (<klasör>/magaza/aciklamalar.md ve diller/<dil>.md) türetilir.
 *   - Uzun açıklama, <klasör>/magaza/app-store.json › "degistir" ile iPhone'a uyarlanır (ör. Ölçü Kutusu'nda ışık ölçer
 *     yok, Calqora iPhone'da yalnız dikey). Her değiştirilecek metin kaynakta tam olarak bulunmalıdır; yoksa hata.
 *   - Sonuna Apple'ın abonelik açıklaması ile Kullanım Koşulları (EULA) ve gizlilik bağlantıları eklenir (App Review 3.1.2).
 *   - Alt başlık, anahtar sözcükler ve tanıtım metni app-store.json › "yerel"den; ad verilmemişse Play'deki ad.
 *   - Destek adresi ve gizlilik politikası adresi app-store.json'dan.
 *
 *   node ios-ortak/app-store.mjs <uygulama>     metinleri yazdırır (gözden geçirme için)
 *   node ios-ortak/app-store.mjs --md           her uygulama için <klasör>/magaza/APP-STORE.md yazar (tam metin)
 *
 * Sınırlar (App Store Connect): ad 30, alt başlık 30, anahtar sözcükler 100, tanıtım metni 170, açıklama 4000 karakter.
 * Sınama: ios-ortak/app-store.test.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** App Store dili → Play mağaza dili */
export const YEREL = {
  tr: 'tr-TR', 'en-US': 'en-US', 'de-DE': 'de-DE', 'fr-FR': 'fr-FR', 'es-ES': 'es-ES', it: 'it-IT', 'pt-BR': 'pt-BR',
  ru: 'ru-RU', 'ar-SA': 'ar', ja: 'ja-JP', ko: 'ko-KR',
};
export const SINIR = { ad: 30, altBaslik: 30, anahtar: 100, tanitim: 170, aciklama: 4000 };
export const EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const KLASOR = { unitica: 'unitica', calqora: 'calqora', 'smart-measure': 'smart-measure' };

/** Apple'ın abonelik açıklaması (3.1.2): yenileme, iptal, yönetim; fiyat uygulamada. {eula}, {gizlilik} yer tutucu. */
export const ALT = {
  tr: 'REKLAMSIZ ABONELİK\nAylık ya da yıllık, kendiliğinden yenilenen abonelik. Ödeme, satın almayı onayladığında Apple hesabından alınır; abonelik, dönem bitmeden en az 24 saat önce iptal edilmezse yenilenir. App Store hesap ayarlarından yönetilir ya da iptal edilir. Fiyatlar uygulamada, kendi para biriminde gösterilir.\nKullanım Koşulları (EULA): {eula}\nGizlilik politikası: {gizlilik}',
  'en-US': 'AD-FREE SUBSCRIPTION\nMonthly or yearly auto-renewable subscription. Payment is charged to your Apple Account when you confirm the purchase; the subscription renews unless it is cancelled at least 24 hours before the end of the current period. Manage or cancel it in your App Store account settings. Prices are shown in the app, in your currency.\nTerms of Use (EULA): {eula}\nPrivacy policy: {gizlilik}',
  'de-DE': 'WERBEFREIES ABO\nMonatliches oder jährliches Abo mit automatischer Verlängerung. Die Zahlung wird bei Bestätigung des Kaufs über den Apple Account abgebucht; das Abo verlängert sich, wenn es nicht spätestens 24 Stunden vor Ablauf des aktuellen Zeitraums gekündigt wird. Verwaltung und Kündigung in den Einstellungen des App-Store-Accounts. Die Preise werden in der App in der eigenen Währung angezeigt.\nNutzungsbedingungen (EULA): {eula}\nDatenschutzerklärung: {gizlilik}',
  'fr-FR': 'ABONNEMENT SANS PUBLICITÉ\nAbonnement mensuel ou annuel à renouvellement automatique. Le paiement est débité du compte Apple à la confirmation de l’achat ; l’abonnement se renouvelle sauf résiliation au moins 24 heures avant la fin de la période en cours. Gestion et résiliation dans les réglages du compte App Store. Les prix sont affichés dans l’app, dans votre devise.\nConditions d’utilisation (CLUF) : {eula}\nPolitique de confidentialité : {gizlilik}',
  'es-ES': 'SUSCRIPCIÓN SIN ANUNCIOS\nSuscripción mensual o anual de renovación automática. El pago se carga a la cuenta de Apple al confirmar la compra; la suscripción se renueva salvo que se cancele al menos 24 horas antes de que termine el período actual. Se gestiona o cancela en los ajustes de la cuenta de App Store. Los precios se muestran en la app, en tu moneda.\nTérminos de uso (EULA): {eula}\nPolítica de privacidad: {gizlilik}',
  it: 'ABBONAMENTO SENZA PUBBLICITÀ\nAbbonamento mensile o annuale a rinnovo automatico. Il pagamento viene addebitato sull’account Apple alla conferma dell’acquisto; l’abbonamento si rinnova se non viene annullato almeno 24 ore prima della fine del periodo in corso. Si gestisce o si annulla nelle impostazioni dell’account App Store. I prezzi sono mostrati nell’app, nella tua valuta.\nTermini d’uso (EULA): {eula}\nInformativa sulla privacy: {gizlilik}',
  'pt-BR': 'ASSINATURA SEM ANÚNCIOS\nAssinatura mensal ou anual com renovação automática. O pagamento é cobrado na conta Apple quando você confirma a compra; a assinatura é renovada, a menos que seja cancelada pelo menos 24 horas antes do fim do período atual. Gerencie ou cancele nos ajustes da conta da App Store. Os preços são mostrados no app, na sua moeda.\nTermos de Uso (EULA): {eula}\nPolítica de privacidade: {gizlilik}',
  ru: 'ПОДПИСКА БЕЗ РЕКЛАМЫ\nЕжемесячная или ежегодная подписка с автоматическим продлением. Оплата списывается с аккаунта Apple при подтверждении покупки; подписка продлевается, если её не отменить не позднее чем за 24 часа до конца текущего периода. Управлять подпиской и отменить её можно в настройках аккаунта App Store. Цены показаны в приложении в вашей валюте.\nУсловия использования (EULA): {eula}\nПолитика конфиденциальности: {gizlilik}',
  'ar-SA': 'اشتراك بلا إعلانات\nاشتراك شهري أو سنوي يتجدد تلقائيًا. يُخصم المبلغ من حساب Apple عند تأكيد الشراء، ويتجدد الاشتراك ما لم يُلغَ قبل 24 ساعة على الأقل من نهاية الفترة الحالية. تتم إدارة الاشتراك أو إلغاؤه من إعدادات حساب App Store. تظهر الأسعار في التطبيق بعملتك.\nشروط الاستخدام (EULA): {eula}\nسياسة الخصوصية: {gizlilik}',
  ja: '広告なしのサブスクリプション\n月額または年額の自動更新サブスクリプションです。お支払いは購入の確定時に Apple アカウントに請求されます。現在の期間が終了する 24 時間前までに解約しない限り自動的に更新されます。App Store のアカウント設定から管理・解約できます。価格はアプリ内でお住まいの地域の通貨で表示されます。\n利用規約（EULA）：{eula}\nプライバシーポリシー：{gizlilik}',
  ko: '광고 없는 구독\n월간 또는 연간 자동 갱신 구독입니다. 결제는 구매를 확인할 때 Apple 계정으로 청구되며, 현재 기간이 끝나기 최소 24시간 전에 취소하지 않으면 구독이 갱신됩니다. App Store 계정 설정에서 관리하거나 취소할 수 있습니다. 가격은 앱에서 현지 통화로 표시됩니다.\n이용 약관(EULA): {eula}\n개인정보 처리방침: {gizlilik}',
};

/** Play metni: ad ve uzun açıklama (tr-TR aciklamalar.md'de, öbürleri diller/<dil>.md'de) */
export function playMetni(klasor, playDil) {
  const dosya = playDil === 'tr-TR' ? path.join(KOK, klasor, 'magaza', 'aciklamalar.md') : path.join(KOK, klasor, 'magaza', 'diller', `${playDil}.md`);
  const m = fs.readFileSync(dosya, 'utf8');
  const ad = /^- \*\*Uygulama adı:\*\* (.+)$/m.exec(m)?.[1].trim();
  const bas = m.indexOf('\n## Uzun açıklama\n');
  const son = bas < 0 ? -1 : m.indexOf('\n## ', bas + 1);
  const uzun = bas < 0 ? '' : m.slice(bas + '\n## Uzun açıklama\n'.length, son < 0 ? undefined : son).trim();
  if (!ad || !uzun) throw new Error(`${dosya}: "Uygulama adı" ya da "## Uzun açıklama" yok`);
  return { ad, uzun };
}

export function ayar(uygulama) {
  return JSON.parse(fs.readFileSync(path.join(KOK, KLASOR[uygulama], 'magaza', 'app-store.json'), 'utf8'));
}

/** Bir uygulamanın bütün App Store dillerindeki metinleri */
export function metinler(uygulama) {
  if (!KLASOR[uygulama]) throw new Error(`bilinmeyen uygulama "${uygulama}" (${Object.keys(KLASOR).join(' | ')})`);
  const a = ayar(uygulama);
  const out = {};
  for (const [yerel, y] of Object.entries(a.yerel)) {
    const play = playMetni(KLASOR[uygulama], YEREL[yerel]);
    let uzun = play.uzun;
    for (const [eski, yeni] of [...(a.degistir?.['*'] || []), ...(a.degistir?.[yerel] || [])]) {
      if (!uzun.includes(eski)) throw new Error(`${uygulama} ${yerel}: değiştirilecek metin Play açıklamasında yok: "${eski.slice(0, 60)}"`);
      uzun = uzun.split(eski).join(yeni);
    }
    const alt = ALT[yerel].replace('{eula}', EULA).replace('{gizlilik}', a.gizlilik);
    out[yerel] = {
      ad: y.ad || play.ad,
      altBaslik: y.altBaslik,
      anahtar: y.anahtar,
      tanitim: y.tanitim,
      aciklama: `${uzun.replace(/\n{3,}/g, '\n\n').trim()}\n\n${alt}`,
      destek: a.destek,
      gizlilik: a.gizlilik,
    };
  }
  return out;
}

/** Gözden geçirme dosyası: <klasör>/magaza/APP-STORE.md */
export function md(uygulama) {
  const m = metinler(uygulama);
  const s = [`# ${uygulama} — App Store metinleri (iOS)`, '',
    'OTOMATİK: `node ios-ortak/app-store.mjs --md` yazar; kaynak Play metinleri ve `app-store.json`. Elle düzenlenmez.', ''];
  for (const [yerel, x] of Object.entries(m)) {
    s.push(`## ${yerel}`, '', `- **Ad (${x.ad.length}/30):** ${x.ad}`, `- **Alt başlık (${x.altBaslik.length}/30):** ${x.altBaslik}`,
      `- **Anahtar sözcükler (${x.anahtar.length}/100):** ${x.anahtar}`, `- **Tanıtım metni (${x.tanitim.length}/170):** ${x.tanitim}`,
      `- **Destek:** ${x.destek}`, `- **Gizlilik:** ${x.gizlilik}`, '', `### Açıklama (${x.aciklama.length}/4000)`, '', x.aciklama, '');
  }
  return s.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--md')) {
    for (const u of Object.keys(KLASOR)) {
      fs.writeFileSync(path.join(KOK, KLASOR[u], 'magaza', 'APP-STORE.md'), md(u));
      console.log(`${KLASOR[u]}/magaza/APP-STORE.md yazıldı`);
    }
  } else {
    const u = process.argv[2];
    if (!u) { console.error('kullanım: node ios-ortak/app-store.mjs <uygulama> | --md'); process.exit(2); }
    console.log(md(u));
  }
}
