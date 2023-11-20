import { Crypto } from '@peculiar/webcrypto';
import { cryptoProvider } from '@peculiar/x509';

const crypto = new Crypto();
cryptoProvider.set(crypto as globalThis.Crypto);

export default crypto;
