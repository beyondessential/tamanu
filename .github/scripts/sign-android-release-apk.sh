#!/usr/bin/env bash
# Zipalign and sign a release APK using the repo keystore and CI signing env vars.
# Usage: sign-android-release-apk.sh <unsigned.apk> <signed.apk>
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: sign-android-release-apk.sh <unsigned.apk> <signed.apk>" >&2
  exit 1
fi

UNSIGNED_APK=$1
SIGNED_APK=$2

: "${ANDROID_SIGNING_STORE_PASSWORD:?ANDROID_SIGNING_STORE_PASSWORD is required}"
: "${ANDROID_SIGNING_KEY_ALIAS:?ANDROID_SIGNING_KEY_ALIAS is required}"
: "${ANDROID_SIGNING_KEY_PASSWORD:?ANDROID_SIGNING_KEY_PASSWORD is required}"

KEYSTORE="${KEYSTORE:-packages/mobile/android/app/release.keystore}"

resolve_android_sdk_root() {
  if [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then
    echo "${ANDROID_SDK_ROOT}"
    return
  fi
  if [[ -n "${ANDROID_HOME:-}" ]]; then
    echo "${ANDROID_HOME}"
    return
  fi
  local props="packages/mobile/android/local.properties"
  if [[ -f "${props}" ]]; then
    grep '^sdk.dir=' "${props}" | cut -d= -f2-
    return
  fi
  echo "Could not resolve Android SDK root (set ANDROID_SDK_ROOT or run Gradle once)" >&2
  exit 1
}

SDK_ROOT=$(resolve_android_sdk_root)
BUILD_TOOLS=$(find "${SDK_ROOT}/build-tools" -mindepth 1 -maxdepth 1 | sort -V | tail -1)
ZIPALIGN="${BUILD_TOOLS}/zipalign"
APKSIGNER="${BUILD_TOOLS}/apksigner"

for tool in "${ZIPALIGN}" "${APKSIGNER}"; do
  if [[ ! -x "${tool}" ]]; then
    echo "Missing Android build tool: ${tool}" >&2
    exit 1
  fi
done

ALIGNED="$(mktemp --suffix=.apk)"
trap 'rm -f "${ALIGNED}"' EXIT

"${ZIPALIGN}" -f -p 4 "${UNSIGNED_APK}" "${ALIGNED}"
"${APKSIGNER}" sign \
  --ks "${KEYSTORE}" \
  --ks-key-alias "${ANDROID_SIGNING_KEY_ALIAS}" \
  --ks-pass "pass:${ANDROID_SIGNING_STORE_PASSWORD}" \
  --key-pass "pass:${ANDROID_SIGNING_KEY_PASSWORD}" \
  --out "${SIGNED_APK}" \
  "${ALIGNED}"

echo "Wrote signed APK to ${SIGNED_APK}"
