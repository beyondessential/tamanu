#!/usr/bin/env bash
# Merge single-ABI unsigned release APKs into one universal APK.
# Usage: merge-android-release-apks.sh <output.apk> <base.apk> [other.apk ...]
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: merge-android-release-apks.sh <output.apk> <base.apk> [other.apk ...]" >&2
  exit 1
fi

OUTPUT_APK=$1
BASE_APK=$2
shift 2
OTHER_APKS=("$@")

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

STAGING="$WORKDIR/staging"
mkdir -p "$STAGING"

echo "Using base APK: ${BASE_APK}"
unzip -q "${BASE_APK}" -d "${STAGING}"

for apk in "${OTHER_APKS[@]}"; do
  echo "Merging native libs from: ${apk}"
  unzip -q -o "${apk}" "lib/*" -d "${STAGING}"
done

UNSIGNED="$WORKDIR/merged-unsigned.apk"
( cd "${STAGING}" && zip -q -r "${UNSIGNED}" . )

mkdir -p "$(dirname "${OUTPUT_APK}")"
cp "${UNSIGNED}" "${OUTPUT_APK}"
echo "Wrote unsigned universal APK to ${OUTPUT_APK}"
