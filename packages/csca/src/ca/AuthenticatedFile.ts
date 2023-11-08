import { promises as fs } from 'fs';

import crypto from '../crypto';
import { keyPairFromPrivate } from '../utils';

export default class AuthenticatedFile {
  private path: string;
  private key: CryptoKey;
  private createFile: boolean;

  constructor(path: string, key: CryptoKey, createFile = false) {
    this.path = path;
    this.key = key;
    this.createFile = createFile;
  }

  private sigFile(): string {
    return `${this.path}.sig`;
  }

  protected async loadFile(): Promise<Buffer> {
    if (this.createFile) return Buffer.alloc(0);

    const contents = await fs.readFile(this.path);

    try {
      const publicKey =
        this.key.type === 'private' ? (await keyPairFromPrivate(this.key)).publicKey : this.key;

      const sig = await fs.readFile(this.sigFile());
      const check = await crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: 'SHA-256',
        },
        publicKey,
        sig,
        contents,
      );

      if (!check) throw new Error('Signature is invalid');
    } catch (e) {
      throw new Error(`Tampering error: ${this.path} fails signature check\n${e}`);
    }

    return contents;
  }

  protected async writeFile(contents: Buffer): Promise<void> {
    if (this.key.type !== 'private') throw new Error('Cannot write with public key');

    const sig = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      this.key,
      contents,
    );

    await fs.writeFile(this.path, contents);
    await fs.writeFile(this.sigFile(), Buffer.from(sig));
    this.createFile = false;
  }

  public async check(): Promise<void> {
    // TODO: optimisation in this case as we don't need to load the
    // whole file into memory, just check its signature. Streaming?
    await this.loadFile();
  }
}
