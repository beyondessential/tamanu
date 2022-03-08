import config from 'config';

const calculateLuhnModN = require('calculate-luhn-mod-n');

export function generateEUDCCFormatUVCI(vaccinationId) {
  // UVCI id is required to be uppercase alphanumeric
  // Use the uuid of the vaccination record, drop the dashes
  const id = vaccinationId.replace(/-/g, '').toUpperCase();
  // NOTE: Can probably move this country code to a better place in the config
  const countryCode = config.integrations.vds.csr.subject.countryCode2;

  const UVCI = `URN:UVCI:01:${countryCode}:${id}`;

  if (config.integrations.vds.checksum?.enabled) {
    const { radix } = config.integrations.vds.checksum;
    const checksum = calculateLuhnModN(
      char => Number.parseInt(char, radix), // character to code point
      codePoint => codePoint.toString(radix).toUpperCase(), // code point to character
      radix,
      id, // input
    );
    return `${UVCI}#${checksum}`;
  }

  return UVCI;
}
