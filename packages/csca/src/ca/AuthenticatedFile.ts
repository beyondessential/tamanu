import { KeyObject, sign, verify } from 'crypto';
import { promises as fs } from 'fs';

export default class AuthenticatedFile {
  private path: string;
  private key: KeyObject;
  private newfile: boolean;

  constructor(path: string, key: KeyObject, newfile: boolean = false) {
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
      const check = verify(null, contents, {
        key: this.key,
        dsaEncoding: 'der',
      }, sig);

      if (!check) throw new Error('Signature is invalid');
    } catch (e) {
      if (!this.newfile) {
        throw new Error(`Tampering error: ${this.path} fails signature check\n${e}`);
      }
    }

    return contents;
  }

  protected async writeFile(contents: Buffer) {
    const sig = sign(null, contents, {
      key: this.key,
      dsaEncoding: 'der',
    });

    await fs.writeFile(this.path, contents);
    await fs.writeFile(this.sigFile(), sig);
    this.newfile = false;
  }
}
