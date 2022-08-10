const PUBLIC_KEY = `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbFWYwdXqXLduhP4PuV0zQjGgvnbL
+r3Wiy8PXnUjKWSDXCwEcl84/UFXj/IyB5mkwVXLtRK+moY89dG3+6fGaQ==
-----END PUBLIC KEY-----
`.trim();

export default async function publicKeys() {
  return [KEYUTIL.getKey(PUBLIC_KEY)];
}
