set -euo pipefail
for file in $(
  find "${1:-.}" \
    -name '*.css' -or \
    -name '*.js' -or \
    -name '*.svg' -or \
    -name '*.html'
); do
  echo "precompressing $file"
  zstd -f -T0 -19 -o $file.zst $file
  gzip -f -9 -k $file
  brotli -f -Z -k $file
done
