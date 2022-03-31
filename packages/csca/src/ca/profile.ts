import { Duration } from 'date-fns';

import { ComputedExtension, Extension, ExtensionName } from './certificateExtensions';
import { Country } from './Config';
import { EKU_VDS_NC, EKU_DCC_TEST, EKU_DCC_VACCINATION, EKU_DCC_RECOVERY } from './constants';

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
export function signerWorkingTime(profile: Profile): Duration {
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
export function signerDefaultValidity(profile: Profile): Duration {
  switch (profile) {
    case Profile.VDS:
      return { days: 10 * 365 + 2 };
    case Profile.EUDCC:
      return { days: 365 };
  }
}

interface SignerExtensionParams {
  country: Country;
}

/**
 * The set of extensions set on issued certificates depends on the issuance profile.
 */
export function signerExtensions(
  profile: Profile,
  { country }: SignerExtensionParams,
): Extension[] {
  switch (profile) {
    case Profile.VDS:
      return [
        {
          name: ExtensionName.AuthorityKeyIdentifier,
          critical: false,
          value: ComputedExtension,
        },
        { name: ExtensionName.DocType, critical: false, value: ['NT', 'NV'] },
        { name: ExtensionName.ExtendedKeyUsage, critical: true, value: [EKU_VDS_NC] },
      ];

    case Profile.EUDCC:
      return [
        {
          name: ExtensionName.AuthorityKeyIdentifier,
          critical: false,
          value: ComputedExtension,
        },
        {
          name: ExtensionName.SubjectKeyIdentifier,
          critical: false,
          value: ComputedExtension,
        },
        {
          name: ExtensionName.PrivateKeyUsagePeriod,
          critical: false,
          value: ComputedExtension,
        },
        { name: ExtensionName.KeyUsage, critical: true, value: ['digitalSignature'] },
        {
          name: ExtensionName.SubjectAltName,
          critical: false,
          value: [{ L: country.alpha3 }],
        },
        {
          name: ExtensionName.IssuerAltName,
          critical: false,
          value: [{ L: country.alpha3 }],
        },
        {
          name: ExtensionName.ExtendedKeyUsage,
          critical: true,
          value: [EKU_DCC_TEST, EKU_DCC_VACCINATION, EKU_DCC_RECOVERY],
        },
        {
          name: ExtensionName.CrlDistributionPoints,
          critical: false,
          value: ComputedExtension,
        },
      ];
  }
}
