const PUBLIC_KEY_OLD = `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbFWYwdXqXLduhP4PuV0zQjGgvnbL
+r3Wiy8PXnUjKWSDXCwEcl84/UFXj/IyB5mkwVXLtRK+moY89dG3+6fGaQ==
-----END PUBLIC KEY-----
`.trim();

const PUBLIC_KEY_NEW = `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEkgWybGNvC+QC4ueSz6fYRCO8nTQO
vaz71Avpj0tmzz1dIE3mCZkbA3UGdm7jpQOv65kkAiE7rA+dJ/YBFjfNIw==
-----END PUBLIC KEY-----
`.trim();

export default async function publicKeys() {
  return [
    KEYUTIL.getKey(PUBLIC_KEY_OLD),
    KEYUTIL.getKey(PUBLIC_KEY_NEW),
  ];
}
