import config from 'config';
import { log } from '../../services/logging';
import generateUUIDDateTimeHash from '../generateUUIDDateTimeHash';
import generateEUDCCFormatUVCI from './eudcc';

// Generate UVCI without using any sequelize model
// Useful when generating UVCI in the front end
export function generateUVCIFromRecords(patient, vaccination) {
  // const conf = config.integrations.vds;
  log.debug('Generating UVCI');

  // Generate specific UVCI
  switch ('icao') {
    case 'icao':
      return generateUUIDDateTimeHash(patient.id, vaccination.updatedAt);
    case 'eudcc':
      return generateEUDCCFormatUVCI(vaccination);
    default:
      log.error(`Unrecognised UVCI format ${conf.format}`);
      return '';
  }
}
