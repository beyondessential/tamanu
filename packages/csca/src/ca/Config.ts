import { join } from 'path';

import { add, Duration } from 'date-fns';

import AuthenticatedFile from './AuthenticatedFile';
import { Extension } from './certificateExtensions';

export default class Config extends AuthenticatedFile {
  constructor(caPath: string, key: CryptoKey, newfile: boolean = false) {
    super(join(caPath, 'config.json'), key, newfile);
  }

  private async load(): Promise<ConfigFile> {
    return JSON.parse((await this.loadFile()).toString('utf-8'));
  }

  private async write(config: ConfigFile) {
    await this.writeFile(Buffer.from(JSON.stringify(config, null, 2), 'utf-8'));
  }

  public async create(config: ConfigFile) {
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

export function period(start: Date, duration: Duration): Period {
  return {
    start: start,
    end: add(start, duration),
  };
}
