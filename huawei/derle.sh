#!/usr/bin/env bash
# huawei/derle.sh <uygulama>: uygulamanın AppGallery APK'sını kaynaktan derler, verilen anahtarla imzalar ve
# $RUNNER_TEMP/apk/<uygulama>.apk olarak bırakır. Huawei işi NetcadDevelop'tan çalıştığında kullanılır: orada Lispler'in
# artifact'ları indirilemez ve Lispler'in yükleme anahtarı yoktur; APK'lar MARFEN'in (DWG OfficeZip) anahtarıyla imzalanır.
# Bu yüzden AppGallery'deki her güncelleme de aynı anahtarla, aynı yoldan derlenmelidir (Play sürümü Poyraz anahtarıyla kalır).
# Anahtar ortamdan: HUAWEI_KS_B64 (jks, base64), HUAWEI_KS_PAROLA, HUAWEI_KEY_ALIAS, HUAWEI_KEY_PAROLA (yoksa KS_PAROLA).
# Anahtar dosyası yalnız derleme süresince diske yazılır. keystore.properties yoksa Gradle sessizce debug anahtarıyla
# imzalar: bu betik imzayı denetler, debug imzalı ya da AdMob TEST kimlikli APK'yı reddeder.
set -euo pipefail
U="$1"
cd "$(dirname "$0")/.."
J=huawei/uygulamalar.json
K=$(jq -r --arg u "$U" '.[$u].klasor' "$J"); TIP=$(jq -r --arg u "$U" '.[$u].tip' "$J"); PAKET=$(jq -r --arg u "$U" '.[$u].paket' "$J")
[ "$K" != null ] && [ -d "$K/android" ] || { echo "::error::$U için kaynak klasörü yok"; exit 1; }
: "${HUAWEI_KS_B64:?imza anahtarı yok (HUAWEI_KS_B64)}" "${HUAWEI_KS_PAROLA:?}" "${HUAWEI_KEY_ALIAS:?}"

if [ "$TIP" = capacitor ]; then
  ( cd "$K" && npm ci --no-audit --no-fund && node araclar/kimlik.mjs && npx cap sync android )
fi

KS="$RUNNER_TEMP/huawei-imza.jks"
printf '%s' "$HUAWEI_KS_B64" | base64 -d > "$KS"
printf 'storeFile=%s\nstorePassword=%s\nkeyAlias=%s\nkeyPassword=%s\n' "$KS" "$HUAWEI_KS_PAROLA" "$HUAWEI_KEY_ALIAS" \
  "${HUAWEI_KEY_PAROLA:-$HUAWEI_KS_PAROLA}" > "$K/android/keystore.properties"
trap 'rm -f "$K/android/keystore.properties" "$KS"' EXIT
( cd "$K/android" && chmod +x gradlew && ./gradlew assembleRelease --no-daemon --console=plain )

APK=$(ls "$K"/android/app/build/outputs/apk/release/*.apk | head -1)
BT="$(ls -d "$ANDROID_HOME"/build-tools/*/ | sort -V | tail -1)"
SERT=$("$BT/apksigner" verify --print-certs "$APK")
printf '%s\n' "$SERT" | grep -E 'certificate DN|SHA-256' | head -2
if printf '%s' "$SERT" | grep -q 'CN=Android Debug'; then echo "::error::APK debug anahtarıyla imzalanmış"; exit 1; fi
ROZET=$("$BT/aapt2" dump badging "$APK" | head -1); echo "$ROZET"
P=$(printf '%s' "$ROZET" | sed -n "s/.*package: name='\([^']*\)'.*/\1/p")
[ "$P" = "$PAKET" ] || { echo "::error::paket adı $P, beklenen $PAKET"; exit 1; }
if "$BT/aapt2" dump xmltree --file AndroidManifest.xml "$APK" | grep -q 'ca-app-pub-3940256099942544'; then
  echo "::error::APK AdMob TEST kimliğiyle derlenmiş: AppGallery'ye yüklenmez"; exit 1
fi
mkdir -p "$RUNNER_TEMP/apk"; cp "$APK" "$RUNNER_TEMP/apk/$U.apk"
echo "APK hazır: $RUNNER_TEMP/apk/$U.apk ($(du -h "$APK" | cut -f1))"
