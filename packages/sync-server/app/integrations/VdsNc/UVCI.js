import { generateUVCI } from 'shared/utils';
import { AdministeredVaccine, Encounter } from 'shared/models';
import { getLocalisationData } from '../../utils/localisation';

export async function generateUVCIForPatient(patientId) {
  const format = getLocalisationData('uvci.format');
  const countryCode = getLocalisationData('country.alpha-2');
  // Fetch most recent vaccination for patient
  const vaccination = await AdministeredVaccine.findOne({
    where: {
      '$encounter.patient_id$': patientId,
      status: 'GIVEN',
    },
    order: [['date', 'DESC']],
    include: [
      {
        model: Encounter,
        as: 'encounter',
      },
    ],
  });

  const vaccinationId = vaccination.get('id');
  return generateUVCI(vaccinationId, format, { countryCode });
}
