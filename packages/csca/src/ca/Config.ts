import { join } from 'path';

import { add } from 'date-fns';

import AuthenticatedFile from './AuthenticatedFile';
import { Extension } from './certificateExtensions';
import { truncateToSeconds } from '../utils';

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
}

export interface ConfigFile {
  name: string;
  country: Country;
  subject: Subject;
  crl: CRL;
  validityPeriod: Period;
  workingPeriod: Period;
  issuance: Issuance;
}

export interface Country {
  name?: string;
  alpha2: string;
  alpha3: string;
}

export interface Subject {
  country: string;
  commonName: string;
  organisation?: string;
  organisationUnit?: string;
}

export interface CRL {
  filename: string;
  distribution: string[];
  bucket: S3Bucket;
}

export interface S3Bucket {
  region: string;
  name: string;
}

export interface Issuance {
  extensions: Extension[];
  validityPeriodDays: number;
  workingPeriodDays: number;
}

export interface Period {
  start: Date;
  end: Date;
}

export function period(start: Date, days: number): Period {
  return {
    start: truncateToSeconds(start),
    end: truncateToSeconds(add(start, { days })),
  };
}
