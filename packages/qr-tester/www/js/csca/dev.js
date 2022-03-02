import { base64Decode, ec256PublicKey } from '../encodings.js';

const PUBLIC_KEY = `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEvgyVMe/CYMWfo3+UFs33WF2MZcpJVasBBDuiDotS9vio4U/7PkgVrsa3Da21zq3UtfBW6c3av6E/vQUirGJfJQ==`;

export default async function publicKeys() {
  return [await ec256PublicKey(base64Decode(PUBLIC_KEY))];
}
