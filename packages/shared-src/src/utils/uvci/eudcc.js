import config from 'config';

export default function generateEUDCCFormatUVCI(vaccinationRecord) {
  // UVCI id is required to be uppercase alphanumeric
  // Use the uuid of the vaccination record, drop the dashes
  const id = vaccinationRecord.id.replace(/-/g, '').toUpperCase();
  // NOTE: Can probably move this country code to a better place in the config
  const countryCode = config.integrations.vds.csr.subject.countryCode2;

  const UVCI = `URN:UVCI:01:${countryCode}:${id}`;

  if (config.integrations.vds.checksum) {
    const checksum = 'B';
    return `${UVCI}#${checksum}`;
  }

  return UVCI;
}
