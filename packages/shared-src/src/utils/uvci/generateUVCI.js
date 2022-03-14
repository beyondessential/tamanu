import { log } from '../../services/logging';
import { generateICAOFormatUVCI } from './icao';
import { generateEUDCCFormatUVCI } from './eudcc';

export function generateUVCI(vaccinationId, format, options) {
  log.debug('Generating UVCI');
  // Generate specific UVCI
  switch (format) {
    case 'icao':
      return generateICAOFormatUVCI(vaccinationId);
    case 'eudcc':
      return generateEUDCCFormatUVCI(vaccinationId, options.countryCode);
    default:
      log.error(`Unrecognised UVCI format ${format}`);
      return '';
  }
}
