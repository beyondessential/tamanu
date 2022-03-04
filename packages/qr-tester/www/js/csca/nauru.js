const PUBLIC_KEY = `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEvO+a0occM2cr5L/4ZILfLhuHcv3G
2LNqkKe0fl2p8nkCVj02GzENDfB9fLaIGtzLJnJMwCTgEAA+LwhZSF8V+Q==
-----END PUBLIC KEY-----
`.trim();

export default async function publicKeys() {
  return [KEYUTIL.getKey(PUBLIC_KEY)];
}
