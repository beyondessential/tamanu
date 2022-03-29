import { add, Duration, Interval } from 'date-fns';
import { promises as fs } from 'fs';
import { join } from 'path';

export const CRL_URL_BASE: string = 'http://crl.tamanu.io';

/**
 * Working time (PKUP - Private Key Usage Period) of CSCA (Country Signing Certificate Authority).
 *
 * Recommendation is between 3 and 5 years. We use 4 years (365 * 4 plus 1 leap day),
 * such that we set the validity to a nice round 15 years and
 * it gives us a maximum BSC (ICAO Barcode Signer Certificate) validity of 11 years.
 */
export const CSCA_PKUP: Duration = { days: 365 * 4 + 1 };

/**
 * Validity (excluding PKUP) of CSCA.
 *
 * 11 years (365 * 11 + 3 leap days)
 * such that it includes sign_maxdocuse (10 years) + max sign_pkup (1 year).
 */
export const CSCA_MAXCERTUSE: Duration = { days: 11 * 365 + 3 };

/**
 * Validity (including PKUP) of CSCA.
 */
export const CSCA_VALIDITY: Duration = { days: CSCA_PKUP.days! + CSCA_MAXCERTUSE.days! };

/** Extended key usage: Health CSCA */
export const EKU_HEALTH_CSCA: string = '2.23.136.1.1.14.1';

/** Extended key usage: VDS-NC */
export const EKU_VDS_NC: string = '2.23.136.1.1.14.2';

/** Extended key usage: EU DCC Test certificate */
export const EKU_DCC_TEST: string = '1.3.6.1.4.1.1847.2021.1.1';

/** Extended key usage: EU DCC Vaccination certificate */
export const EKU_DCC_VACCINATION: string = '1.3.6.1.4.1.1847.2021.1.2';

/** Extended key usage: EU DCC Recovery certificate */
export const EKU_DCC_RECOVERY: string = '1.3.6.1.4.1.1847.2021.1.3';

export enum Profile {
  VDS = 'vds',
  EUDCC = 'eudcc',
}

/**
 * Working time of issued signer certificates (BSC) is derived from the issuance profile.
 *
 * - VDS: 3 months + some margin = 96 days
 * - EUDCC: exactly one year = 365 days
 */
function signerWorkingTime(profile: Profile): Duration {
  switch (profile) {
    case Profile.VDS:
      return { days: 96 };
    case Profile.EUDCC:
      return { days: 365 };
  }
}

/**
 * Default validity of issued signer certificates (BSC) is derived from the issuance profile.
 *
 * - VDS: 10 years (for maximum flexibility) + 2 leap days
 * - EUDCC: 1 year (recommendation from the spec)
 */
function signerDefaultValidity(profile: Profile): Duration {
  switch (profile) {
    case Profile.VDS:
      return { days: 10 * 365 + 2 };
    case Profile.EUDCC:
      return { days: 365 };
  }
}

/**
 * The set of extensions set on issued certificates depends on the issuance profile.
 */
function signerExtensions(profile: Profile): Extension[] {
  switch (profile) {
    case Profile.VDS:
      return [
        {
          name: ExtensionName.AuthorityKeyIdentifier,
          critical: true,
          value: ComputedExtension.IssuerKeyId,
        },
        { name: ExtensionName.ExtendedKeyUsage, critical: false, value: [EKU_VDS_NC] },
        { name: ExtensionName.DocType, critical: false, value: ['NT', 'NV'] },
      ];

    case Profile.EUDCC:
      return [
        {
          name: ExtensionName.AuthorityKeyIdentifier,
          critical: true,
          value: ComputedExtension.IssuerKeyId,
        },
        {
          name: ExtensionName.SubjectKeyIdentifier,
          critical: false,
          value: ComputedExtension.SelfKeyId,
        },
        {
          name: ExtensionName.PrivateKeyUsagePeriod,
          critical: false,
          value: ComputedExtension.Pkup,
        },
        { name: ExtensionName.KeyUsage, critical: true, value: ['DigitalSignature'] },
        {
          name: ExtensionName.ExtendedKeyUsage,
          critical: false,
          value: [EKU_DCC_TEST, EKU_DCC_VACCINATION, EKU_DCC_RECOVERY],
        },
        {
          name: ExtensionName.CrlDistributionPoints,
          critical: false,
          value: ComputedExtension.CrlDistPoints,
        },
      ];
  }
}

export default class FolderCA {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  private join(...paths: string[]) {
    return join(this.path, ...paths);
  }

  public async create(
    shortname: string,
    fullname: string,
    countryAlpha2: string,
    countryAlpha3: string,
    profile: Profile,
    provider: undefined | string,
    deptOrg: undefined | string,
  ) {
    if (await fs.stat(this.path).then(() => true, () => false)) {
      throw new Error(`${this.path} already exists, not overwriting`);
    }

    for (const dir of ['.', 'certs']) {
      const path = this.join(dir);
      console.debug('mkdir', path);
      await fs.mkdir(path, { recursive: true });
    }

    const now = new Date();

    await this.writeAndSign(JSON.stringify({
      name: shortname,
      country: {
        alpha2: countryAlpha2,
        alpha3: countryAlpha3,
      },
      subject: {
        country: countryAlpha2,
        commonName: fullname,
        organisation: provider,
        organisationUnit: deptOrg,
      },
      crl: {
        filename: `${shortname}.crl`,
        distribution: [`${CRL_URL_BASE}/${shortname}.crl`],
      },
      validityPeriod: period(now, CSCA_VALIDITY),
      workingPeriod: period(now, CSCA_PKUP),
      issuance: {
        extensions: signerExtensions(profile),
        validityPeriod: period(now, signerDefaultValidity(profile)),
        workingPeriod: period(now, signerWorkingTime(profile)),
      },
    } as Config), 'config.json', 'config.sig');
  }

  private async writeAndSign(content: string | Buffer, file: string, signatureFile: string) {
    await fs.writeFile(this.join(file), content);
    // TODO: sign
  }
}

export interface Config {
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
  validityPeriod: Interval;
  workingPeriod: Interval;
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
  DocType = 'DocType',
}

export enum ComputedExtension {
  IssuerKeyId = 'aki',
  SelfKeyId = 'ski',
  Pkup = 'pkup',
  CrlDistPoints = 'crl',
}

export function period(start: Date, duration: Duration): Interval {
  return {
    start: start,
    end: add(start, duration),
  };
}
