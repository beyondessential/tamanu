#!/usr/bin/env bash
# Download a Node.js runtime from nodejs.org, verify it against the published
# SHASUMS256.txt, and place it in a server release bundle's runtime/ directory
# for pm2 to use as its interpreter (see packages/*/pm2.config.cjs).
#
# .node-version names a release series (a major, e.g. 26), so the bundle gets the
# latest release in that series at build time; a full version is used as-is.
#
# Usage: scripts/embed-node-runtime.sh <platform> <release-dir>
#   platform:    win-x64 | linux-x64 | linux-arm64 | darwin-arm64 | ...
#   release-dir: the release bundle root (gets a runtime/ subdirectory)
set -euo pipefail

platform="${1:?Expected platform, e.g. win-x64 or linux-x64}"
release_dir="${2:?Expected release directory}"

case "$platform" in
  win-*) extension=zip ;;
  *) extension=tar.xz ;;
esac

series="$(tr -d 'v \t\r\n' < .node-version)"
if [[ "$series" == *.* ]]; then
  version="$series"
else
  # the latest-vNN.x directory lists the series' newest release; the version is
  # read from its archive names, then everything is fetched from the versioned
  # directory so a release landing mid-build can't mix files from two versions
  version="$(curl -fsSL "https://nodejs.org/dist/latest-v${series}.x/SHASUMS256.txt" \
    | sed -n "s/^[0-9a-f]*  node-v\([0-9.]*\)-${platform}\.${extension}$/\1/p")"
  [[ -n "$version" ]] || { echo "No Node ${series}.x release found for ${platform}" >&2; exit 1; }
fi

base="https://nodejs.org/dist/v${version}"
runtime="${release_dir}/runtime"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

archive="node-v${version}-${platform}.${extension}"

curl -fsSL -o "${work}/${archive}" "${base}/${archive}"
curl -fsSL -o "${work}/SHASUMS256.txt" "${base}/SHASUMS256.txt"

# fail-closed: grep exits non-zero (and pipefail trips) if the archive isn't listed.
# -F so the dots in the version aren't treated as regex; the leading space anchors
# the filename field (SHASUMS lines are "<hash>  <filename>").
( cd "$work" && grep -F " ${archive}" SHASUMS256.txt | sha256sum -c - )

mkdir -p "$runtime"
extracted="${work}/node-v${version}-${platform}"
case "$platform" in
  win-*)
    ( cd "$work" && unzip -q "$archive" )
    cp -p "${extracted}/node.exe" "${runtime}/node.exe"
    ;;
  *)
    ( cd "$work" && tar -xf "$archive" )
    mkdir -p "${runtime}/bin"
    cp -p "${extracted}/bin/node" "${runtime}/bin/node"
    ;;
esac

echo "Embedded official Node ${version} (${platform}) into ${runtime}"
