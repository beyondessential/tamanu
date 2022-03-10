const PUBLIC_KEY = `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEvgyVMe/CYMWfo3+UFs33WF2MZcpJ
VasBBDuiDotS9vio4U/7PkgVrsa3Da21zq3UtfBW6c3av6E/vQUirGJfJQ==
-----END PUBLIC KEY-----
`.trim();

export default async function publicKeys() {
  return [KEYUTIL.getKey(PUBLIC_KEY)];
}
