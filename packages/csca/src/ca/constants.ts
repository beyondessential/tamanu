export const CRL_URL_BASE = 'http://crl.tamanu.io';

/**
 * Working time (PKUP - Private Key Usage Period) of CSCA (Country Signing Certificate Authority).
 *
 * Recommendation is between 3 and 5 years. We use 4 years (365 * 4 plus 1 leap day),
 * such that we set the validity to a nice round 15 years and
 * it gives us a maximum BSC (ICAO Barcode Signer Certificate) validity of 11 years.
 */
export const CSCA_PKUP = 365 * 4 + 1;

/**
 * Validity (excluding PKUP) of CSCA.
 *
 * 11 years (365 * 11 + 3 leap days)
 * such that it includes sign_maxdocuse (10 years) + max sign_pkup (1 year).
 */
export const CSCA_MAXCERTUSE = 11 * 365 + 3;

/**
 * Validity (including PKUP) of CSCA.
 */
export const CSCA_VALIDITY = CSCA_PKUP + CSCA_MAXCERTUSE;

/** Extended key usage: Health CSCA */
export const EKU_HEALTH_CSCA = '2.23.136.1.1.14.1';

/** Extended key usage: VDS-NC */
export const EKU_VDS_NC = '2.23.136.1.1.14.2';

/** Extended key usage: EU DCC Test certificate */
export const EKU_DCC_TEST = '1.3.6.1.4.1.1847.2021.1.1';

/** Extended key usage: EU DCC Vaccination certificate */
export const EKU_DCC_VACCINATION = '1.3.6.1.4.1.1847.2021.1.2';

/** Extended key usage: EU DCC Recovery certificate */
export const EKU_DCC_RECOVERY = '1.3.6.1.4.1.1847.2021.1.3';

/**
 * Extension type ID for ICAO signer document type
 *
 * ```
 * id-icao-mrtd-security-extensions-documentTypeList OBJECT
 *     IDENTIFIER ::= {id-icao-mrtd-security-extensions 2}
 * ```
 */
// eslint-disable-next-line camelcase
export const id_icao_mrtd_security_extensions_documentTypeList = '2.23.136.1.1.6.2';
