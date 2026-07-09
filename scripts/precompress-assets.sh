#!/bin/bash
set -euo pipefail

# Precompress static assets so Caddy can serve them with `precompressed zstd br
# gzip`. Prefer the CLIs (fast, multithreaded — used in the Docker frontend
# build where they're installed), and fall back to Node's built-in zlib (zstd,
# brotli, gzip all present in the Tamanu Node version) so this also runs on a
# Windows runner without extra tooling.

have() { command -v "$1" >/dev/null 2>&1; }

node_compress() {
  # $1 = algo (zstd|brotli|gzip), $2 = infile, $3 = outfile
  node -e '
    const fs = require("fs");
    const zlib = require("zlib");
    const [algo, inf, outf] = process.argv.slice(1);
    const buf = fs.readFileSync(inf);
    let out;
    if (algo === "zstd") {
      out = zlib.zstdCompressSync(buf, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 } });
    } else if (algo === "brotli") {
      out = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
    } else {
      out = zlib.gzipSync(buf, { level: 9 });
    }
    fs.writeFileSync(outf, out);
  ' "$1" "$2" "$3"
}

for file in $(
  find "${1:-.}" \
    -name '*.css' -or \
    -name '*.eot' -or \
    -name '*.ico' -or \
    -name '*.js' -or \
    -name '*.svg' -or \
    -name '*.ttf' -or \
    -name '*.html'
); do
  echo "precompressing $file"
  if have zstd;   then zstd -f -T0 -19 -o "$file.zst" "$file"; else node_compress zstd   "$file" "$file.zst"; fi
  if have gzip;   then gzip -f -9 -k "$file";                  else node_compress gzip   "$file" "$file.gz";  fi
  if have brotli; then brotli -f -Z -k "$file";                else node_compress brotli "$file" "$file.br";  fi
done
