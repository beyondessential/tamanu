import { join } from 'path';

import AuthenticatedFile from '../AuthenticatedFile';
import { validate } from './schema';
import { ConfigFile, Country, Issuance, S3Bucket } from './types';

export * from './types';
export { validate } from './schema';

export default class Config extends AuthenticatedFile {
  constructor(caPath: string, key: CryptoKey, createFile = false) {
    super(join(caPath, 'config.json'), key, createFile);
  }

  private async load(): Promise<ConfigFile> {
    return JSON.parse((await this.loadFile()).toString('utf-8'));
  }

  private async write(config: ConfigFile): Promise<void> {
    await this.writeFile(Buffer.from(JSON.stringify(config), 'utf-8'));
  }

  public async create(config: ConfigFile): Promise<void> {
    await this.write(config);
  }

  // The principle is that you always read from file, and always write
  // to file, immediately on needing to get/set information. So you
  // never hold config state in memory. Hence, there's no public load()
  // or write() methods, everything is done through targeted getThing()
  // and setThing() methods.

  public async getCountry(): Promise<Country> {
    const config = await this.load();
    return config.country;
  }

  public async getIssuance(): Promise<Issuance> {
    const config = await this.load();
    return config.issuance;
  }

  public async getCrlFilename(): Promise<string> {
    const config = await this.load();
    return config.crl.filename;
  }

  public async getCrlS3Bucket(): Promise<S3Bucket> {
    const config = await this.load();
    return config.crl.bucket;
  }

  public async export(): Promise<ConfigFile> {
    return this.load();
  }

  public async validateAndImport(config: object): Promise<void> {
    return this.write(await validate(config));
  }
}
