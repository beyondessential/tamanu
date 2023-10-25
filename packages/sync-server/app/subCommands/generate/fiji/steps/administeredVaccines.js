import { fake } from '@tamanu/shared/test-helpers';
import { chance } from '../../chance';
import { insertEncounter } from '../insertEncounter';

export default {
  setup: ['examiners', 'facilitiesDepartmentsAndLocations', 'scheduledVaccines'],
  run: async (store, setupData, patientId) => {
    const { AdministeredVaccine } = store.models;
    const insertVaccination = async scheduledVaccineId => {
      const encounter = await insertEncounter(store, setupData, patientId);
      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        encounterId: encounter.id,
        scheduledVaccineId,
      });
    };
    const doses = chance.integer({ min: 0, max: 2 });
    if (doses >= 1) {
      await insertVaccination(setupData.scheduledVaccines[0].id);
    }
    if (doses >= 2) {
      await insertVaccination(setupData.scheduledVaccines[1].id);
    }
  },
};
