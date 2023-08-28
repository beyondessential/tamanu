import { truncateToSeconds } from '../../utils';
import { Extension } from '../certificateExtensions';
import { add } from 'date-fns';

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
