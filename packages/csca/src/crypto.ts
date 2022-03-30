import { cryptoProvider } from '@peculiar/x509';
import { Crypto } from '@peculiar/webcrypto';

const crypto = new Crypto();
cryptoProvider.set(crypto);

export default crypto;
