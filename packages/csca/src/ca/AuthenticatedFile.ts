import { promises as fs } from 'fs';

import crypto from '../crypto';

export default class AuthenticatedFile {
  private path: string;
  private key: CryptoKey;
  private newfile: boolean;

  constructor(path: string, key: CryptoKey, newfile: boolean = false) {
    this.path = path;
    this.key = key;
    this.newfile = newfile;
  }

  private sigFile(): string {
    return this.path + '.sig';
  }

  protected async loadFile(): Promise<Buffer> {
    if (this.newfile) return Buffer.alloc(0);

    const contents = await fs.readFile(this.path);

    try {
      const sig = await fs.readFile(this.sigFile());
      const check = await crypto.subtle.verify({
        name: 'ECDSA',
        hash: 'SHA-256',
      }, this.key, sig, contents);

      if (!check) throw new Error('Signature is invalid');
    } catch (e) {
      if (!this.newfile) {
        throw new Error(`Tampering error: ${this.path} fails signature check\n${e}`);
      }
    }

    return contents;
  }

  protected async writeFile(contents: Buffer) {
    const sig = await crypto.subtle.sign({
      name: 'ECDSA',
      hash: 'SHA-256',
    }, this.key, contents);

    await fs.writeFile(this.path, contents);
    await fs.writeFile(this.sigFile(), Buffer.from(sig));
    this.newfile = false;
  }
}
