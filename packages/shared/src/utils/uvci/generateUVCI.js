import { generateDefaultFormatUVCI } from './tamanu';
import { generateEUDCCFormatUVCI } from './eudcc';
import { generateICAOFormatUVCI } from './icao';

export function generateUVCI(vaccinationId, { format, countryCode }) {
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
      throw new Error(`Unrecognised UVCI format: ${format}`);
    }
  }
}
