#!/usr/bin/env bash
# huawei/apk-al.sh <uygulama>: main'deki son başarılı Android derlemesinin APK artifact'ını $RUNNER_TEMP/apk/<uygulama>.apk
# olarak indirir. APK artifact'ları 7 günde silindiği için bulunamazsa derleme iş akışını yeniden başlatır ve bekler.
# Paket adı uygulamalar.json ile eşleşmeli; AdMob TEST kimliğiyle derlenmiş APK reddedilir.
set -euo pipefail
U="$1"
# APK_DEPO: artifact'ların bulunduğu depo. Huawei anahtarı başka bir depoda (NetcadDevelop) olduğunda iş oradan çalışır ve
# APK'lar açık Lispler deposundan indirilir; o durumda silinmiş artifact için derleme buradan yeniden başlatılamaz.
REPO="${APK_DEPO:-$GITHUB_REPOSITORY}"
cd "$(dirname "$0")/.."
J=huawei/uygulamalar.json
WF=$(jq -r --arg u "$U" '.[$u].derleme' "$J"); ART=$(jq -r --arg u "$U" '.[$u].artifact' "$J")
DOSYA=$(jq -r --arg u "$U" '.[$u].dosya' "$J"); PAKET=$(jq -r --arg u "$U" '.[$u].paket' "$J")
D="$RUNNER_TEMP/indir-$U"; mkdir -p "$RUNNER_TEMP/apk"

indir() {
  for RUN in $(gh run list -R "$REPO" -w "$WF" -b main -s success -L 5 --json databaseId -q '.[].databaseId'); do
    rm -rf "$D"
    if gh run download "$RUN" -R "$REPO" -n "$ART" -D "$D" 2>/dev/null && [ -f "$D/$DOSYA" ]; then
      echo "APK: $WF koşusu $RUN"; return 0
    fi
  done
  return 1
}

if [ -n "${APK_DIZIN:-}" ] && [ -f "$APK_DIZIN/$DOSYA" ]; then
  # APK_DIZIN: iş başka depodan çalışırken APK'lar o depoya konmuşsa (çapraz depo artifact indirme izni yok) oradan alınır
  rm -rf "$D"; mkdir -p "$D"; cp "$APK_DIZIN/$DOSYA" "$D/$DOSYA"; echo "APK: $APK_DIZIN/$DOSYA"
elif ! indir; then
  if [ "$REPO" != "$GITHUB_REPOSITORY" ]; then
    echo "::error::$REPO'da $ART bulunamadı ya da süresi dolmuş: önce orada $WF elle çalıştırılmalı (Actions › Run workflow)"; exit 1
  fi
  echo "APK artifact'ı yok ya da süresi dolmuş: $WF main'de yeniden derleniyor"
  ONCE=$(gh run list -R "$REPO" -w "$WF" -L 1 --json databaseId -q '.[0].databaseId // 0')
  gh workflow run "$WF" -R "$REPO" --ref main
  YENI=""
  for _ in $(seq 1 30); do
    sleep 10
    YENI=$(gh run list -R "$REPO" -w "$WF" -L 1 --json databaseId -q '.[0].databaseId // 0')
    [ "$YENI" != "$ONCE" ] && break
  done
  [ -n "$YENI" ] && [ "$YENI" != "$ONCE" ] || { echo "::error::yeni derleme başlamadı"; exit 1; }
  gh run watch "$YENI" -R "$REPO" --exit-status --interval 30 > /dev/null
  indir || { echo "::error::$ART indirilemedi"; exit 1; }
fi

AAPT="$(ls -d "$ANDROID_HOME"/build-tools/*/ | sort -V | tail -1)aapt2"
ROZET=$("$AAPT" dump badging "$D/$DOSYA" | head -1); echo "$ROZET"
P=$(printf '%s' "$ROZET" | sed -n "s/.*package: name='\([^']*\)'.*/\1/p")
[ "$P" = "$PAKET" ] || { echo "::error::paket adı $P, beklenen $PAKET"; exit 1; }
if "$AAPT" dump xmltree --file AndroidManifest.xml "$D/$DOSYA" | grep -q 'ca-app-pub-3940256099942544'; then
  echo "::error::APK AdMob TEST kimliğiyle derlenmiş: AppGallery'ye yüklenmez"; exit 1
fi
cp "$D/$DOSYA" "$RUNNER_TEMP/apk/$U.apk"
