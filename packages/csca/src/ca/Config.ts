import { KeyObject } from 'crypto';
import { join } from 'path';

import { add, Duration, Interval } from 'date-fns';

import AuthenticatedFile from './AuthenticatedFile';

export default class Config extends AuthenticatedFile {
  constructor(caPath: string, key: KeyObject, newfile: boolean = false) {
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
}

export interface ConfigFile {
  name: string;
  country: Country;
  subject: Subject;
  crl: CRL;
  validityPeriod: Interval;
  workingPeriod: Interval;
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
  organisation: undefined | string;
  organisationUnit: undefined | string;
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

export interface Extension {
  name: ExtensionName;
  critical: boolean;
  value: ComputedExtension | string[];
}

export enum ExtensionName {
  AuthorityKeyIdentifier = 'AuthorityKeyIdentifier',
  SubjectKeyIdentifier = 'SubjectKeyIdentifier',
  PrivateKeyUsagePeriod = 'PrivateKeyUsagePeriod',
  KeyUsage = 'KeyUsage',
  ExtendedKeyUsage = 'ExtendedKeyUsage',
  CrlDistributionPoints = 'CrlDistributionPoints',
  DocType = 'DocType'
}

export enum ComputedExtension {
  IssuerKeyId = 'aki',
  SelfKeyId = 'ski',
  Pkup = 'pkup',
  CrlDistPoints = 'crl'
}

export function period(start: Date, duration: Duration): Interval {
  return {
    start: start,
    end: add(start, duration),
  };
}
