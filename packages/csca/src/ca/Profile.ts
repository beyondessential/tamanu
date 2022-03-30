import { Duration } from 'date-fns';
import { Extension, ExtensionName, ComputedExtension } from './Config';
import { EKU_VDS_NC, EKU_DCC_TEST, EKU_DCC_VACCINATION, EKU_DCC_RECOVERY } from "./constants";

export enum Profile {
  VDS = 'vds',
  EUDCC = 'eudcc'
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
/**
 * The set of extensions set on issued certificates depends on the issuance profile.
 */
export function signerExtensions(profile: Profile): Extension[] {
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
