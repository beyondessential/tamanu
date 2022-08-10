import { log } from '../../services/logging';
import { generateDefaultFormatUVCI } from './tamanu';
import { generateEUDCCFormatUVCI } from './eudcc';
import { generateICAOFormatUVCI } from './icao';

export function generateUVCI(vaccinationId, { format, countryCode }) {
  log.debug(`Generating ${format} UVCI for vaccination ${vaccinationId}`);
  switch (format) {
    case 'tamanu': {
      return generateDefaultFormatUVCI(vaccinationId, countryCode);
    }

    case 'icao': {
      return generateICAOFormatUVCI(vaccinationId);
    }

    case 'eudcc': {
      return generateEUDCCFormatUVCI(vaccinationId, countryCode);
    }

    default: {
      log.error(`Unrecognised UVCI format: ${format}`);
      return '';
    }
  }
}
