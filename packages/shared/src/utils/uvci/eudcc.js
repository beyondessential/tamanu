import calculateLuhnModN from 'calculate-luhn-mod-n';

export function generateEUDCCFormatUVCI(vaccinationId, countryCode) {
  // UVCI id is required to be uppercase alphanumeric
  // Use the uuid of the vaccination record, drop the dashes
  const id = vaccinationId.replace(/-/g, '').toUpperCase();
  const radix = 36; // 10 digits plus 26 uppercase letters

  const UVCI = `URN:UVCI:01:${countryCode}:${id}`;

  const checksum = calculateLuhnModN(
    char => Number.parseInt(char, radix), // character to code point
    codePoint => codePoint.toString(radix).toUpperCase(), // code point to character
    radix,
    id, // input
  );
  return `${UVCI}#${checksum}`;
}
