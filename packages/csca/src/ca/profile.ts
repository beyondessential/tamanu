import { Country } from './Config';
import { ComputedExtension, Extension, ExtensionName } from './certificateExtensions';
import { EKU_DCC_RECOVERY, EKU_DCC_TEST, EKU_DCC_VACCINATION, EKU_VDS_NC } from './constants';

export enum Profile {
  VDS = 'vds',
  EUDCC = 'eudcc',
}

/**
 * Add some amount of days to periods to pre-empt leap days.
 *
 * Always apply this as the final step.
 */
export function addLeaps(days: number): number {
  return days + (days >= 365 ? Math.ceil(days / 365 / 4) : 0);
}

/**
 * Working time of issued signer certificates (BSC) is derived from the issuance profile.
 *
 * - VDS: 3 months + some margin = 96 days
 * - EUDCC: exactly one year = 365 days
 */
export function signerWorkingDays(profile: Profile): number {
  switch (profile) {
    case Profile.VDS:
      return 96;
    case Profile.EUDCC:
      return 365;
    default:
      throw new Error('Unknown profile');
  }
}

/**
 * Default validity of issued signer certificates (BSC) is derived from the issuance profile.
 *
 * - VDS: working + 10 years (for maximum flexibility)
 * - EUDCC: working + 1 year (recommendation from the spec)
 */
export function signerDefaultValidityDays(profile: Profile): number {
  switch (profile) {
    case Profile.VDS:
      return signerWorkingDays(profile) + 10 * 365;
    case Profile.EUDCC:
      return signerWorkingDays(profile) + 365;
    default:
      throw new Error('Unknown profile');
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

    default:
      throw new Error('Unknown profile');
  }
}
