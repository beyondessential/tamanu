import config from 'config';

const calculateLuhnModN = require('calculate-luhn-mod-n');

export default function generateEUDCCFormatUVCI(vaccinationRecord) {
  // UVCI id is required to be uppercase alphanumeric
  // Use the uuid of the vaccination record, drop the dashes
  // Append the timstamp
  const id = vaccinationRecord.id.replace(/-/g, '').toUpperCase();
  const timestamp = new Date(vaccinationRecord.updatedAt).getTime();
  const UVCI = `${id}${timestamp}`;

  // NOTE: Can probably move this country code to a better place in the config
  const countryCode = config.integrations.vds.csr.subject.countryCode2;

  const formattedUVCI = `URN:UVCI:01:${countryCode}:${UVCI}`;

  if (config.integrations.vds.checksum.enabled) {
    const { radix } = config.integrations.vds.checksum;
    const checksum = calculateLuhnModN(
      char => Number.parseInt(char, radix), // character to code point
      codePoint => codePoint.toString(radix).toUpperCase(), // code point to character
      radix,
      UVCI, // input
    );
    return `${formattedUVCI}#${checksum}`;
  }

  return formattedUVCI;
}
