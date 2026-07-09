#!/bin/bash
set -euo pipefail

# Precompress static assets so Caddy can serve them with `precompressed zstd br
# gzip`. Uses Node's built-in zlib (zstd, brotli and gzip are all available in
# the Tamanu Node version), so no external compression CLIs are required on any
# platform.

node - "${1:-.}" <<'NODE'
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = process.argv[2] ?? '.';
const extensions = new Set(['.css', '.eot', '.ico', '.js', '.svg', '.ttf', '.html']);

const zstd = buf => zlib.zstdCompressSync(buf, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 } });
const brotli = buf => zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
const gzip = buf => zlib.gzipSync(buf, { level: 9 });

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
    } else if (extensions.has(path.extname(entry.name))) {
      console.log(`precompressing ${entryPath}`);
      const buf = fs.readFileSync(entryPath);
      fs.writeFileSync(`${entryPath}.zst`, zstd(buf));
      fs.writeFileSync(`${entryPath}.br`, brotli(buf));
      fs.writeFileSync(`${entryPath}.gz`, gzip(buf));
    }
  }
}

walk(root);
NODE
