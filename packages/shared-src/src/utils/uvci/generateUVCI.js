import { log } from '../../services/logging';
import { generateICAOFormatUVCI } from './icao';
import { generateEUDCCFormatUVCI } from './eudcc';

export function generateUVCI(vaccinationId, format) {
  log.debug(`Generating ${format} UVCI for vaccination ${vaccinationId}`);
  switch (format) {
    case 'icao': {
      return generateICAOFormatUVCI(vaccinationId);
    }

    case 'eudcc': {
      const countryCode = (await getLocalisation()).country['alpha-2'];
      return generateEUDCCFormatUVCI(vaccinationId, countryCode);
    }

    default: {
      log.error(`Unrecognised UVCI format: ${format}`);
      return '';
    }
  }
}
