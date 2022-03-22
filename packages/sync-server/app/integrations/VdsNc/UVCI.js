import { get } from 'lodash';
import { generateUVCI } from 'shared/utils';
import { AdministeredVaccine, Encounter } from 'shared/models';
import { getLocalisation } from '../../localisation';

export async function generateUVCIForPatient(patientId) {
  const localisation = await getLocalisation();
  const countryCode = get(localisation, 'country.alpha-2');
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
  return generateUVCI(vaccinationId, 'icao', { countryCode });
}
