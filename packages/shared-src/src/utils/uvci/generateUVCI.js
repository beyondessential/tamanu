import config from 'config';
import { log } from '../../services/logging';
import generateUUIDDateTimeHash from '../generateUUIDDateTimeHash';
import generateEUDCCFormatUVCI from './eudcc';
import { AdministeredVaccine, Encounter } from '../../models';

export async function generateUVCIForPatient(patientId) {
  const conf = config.integrations.vds;
  log.debug('Generating UVCI');
  // Fetch most recent vaccination for patient
  const vaccination = await AdministeredVaccine.findOne({
    where: {
      '$encounter.patient_id$': patientId,
      status: 'GIVEN',
    },
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: Encounter,
        as: 'encounter',
      },
    ],
  });

  // Generate specific UVCI
  switch (conf.format) {
    case 'icao':
      return generateUUIDDateTimeHash(patientId, vaccination.get('updatedAt'));
    case 'eudcc':
      return generateEUDCCFormatUVCI(vaccination);
    default:
      log.error(`Unrecognised UVCI format ${conf.format}`);
      return '';
  }
}
