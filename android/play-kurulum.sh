#!/usr/bin/env bash
# Not Defteri — Google Play API'ye anahtarsız GitHub erişimi. Google Cloud Shell'de (console.cloud.google.com → >_)
# bir kez çalıştırılır. Bir hizmet hesabı ve yalnız mahmuttari/Lispler deposuna güvenen bir Workload Identity
# sağlayıcısı kurar; anahtar dosyası üretmez. Sonunda yazdığı iki satır android/play-kimlik.env'ye konur.
# Kullanım:  PROJECT=proje-kimligi bash play-kurulum.sh   (PROJECT verilmezse Cloud Shell'in seçili projesi)
set -euo pipefail
REPO=mahmuttari/Lispler
P="${PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
[ -n "$P" ] || { echo "Önce proje seçin: gcloud config set project PROJE_KIMLIGI"; exit 1; }
NUM="$(gcloud projects describe "$P" --format='value(projectNumber)')"
SA="notdefteri-play@${P}.iam.gserviceaccount.com"
ok() { "$@" >/dev/null 2>&1; }

echo "Proje: $P ($NUM)"
gcloud services enable androidpublisher.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project "$P"
ok gcloud iam service-accounts describe "$SA" --project "$P" || \
  gcloud iam service-accounts create notdefteri-play --project "$P" --display-name="Not Defteri Play (GitHub Actions)"
ok gcloud iam workload-identity-pools describe github --location=global --project "$P" || \
  gcloud iam workload-identity-pools create github --location=global --project "$P" --display-name="GitHub Actions"
ok gcloud iam workload-identity-pools providers describe lispler --location=global --workload-identity-pool=github --project "$P" || \
  gcloud iam workload-identity-pools providers create-oidc lispler --location=global --workload-identity-pool=github \
    --project "$P" --display-name="Lispler (Not Defteri)" --issuer-uri=https://token.actions.githubusercontent.com \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository == '${REPO}'"
gcloud iam service-accounts add-iam-policy-binding "$SA" --project "$P" --role=roles/iam.workloadIdentityUser --quiet \
  --member="principalSet://iam.googleapis.com/projects/${NUM}/locations/global/workloadIdentityPools/github/attribute.repository/${REPO}" >/dev/null

echo
echo "=== Bu iki satırı Claude'a gönderin ==="
echo "PLAY_WIF_PROVIDER=projects/${NUM}/locations/global/workloadIdentityPools/github/providers/lispler"
echo "PLAY_SERVICE_ACCOUNT=${SA}"
echo
echo "Play Console → Kullanıcılar ve izinler → Yeni kullanıcı davet et: ${SA}"
