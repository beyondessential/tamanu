import config from 'config';
import { log } from '../../services/logging';
import { generateICAOFormatUVCI } from './icao';
import { generateEUDCCFormatUVCI } from './eudcc';
import { AdministeredVaccine, Encounter } from '../../models';

export async function generateUVCIForPatient(patientId) {
  const { format } = config.integrations.vds;
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

  const vaccinationId = vaccination.get('id');

  // Generate specific UVCI
  switch (format) {
    case 'icao':
      return generateICAOFormatUVCI(vaccinationId);
    case 'eudcc':
      return generateEUDCCFormatUVCI(vaccinationId);
    default:
      log.error(`Unrecognised UVCI format ${format}`);
      return '';
  }
}
