import { fake } from '@tamanu/shared/test-helpers';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

import { chance } from '../chance';

export const insertEncounter = async (store, setupData, patientId) => {
  const { Encounter } = store.models;
  const [, department, location] = chance.pickone(setupData.facilitiesDepartmentsAndLocations);
  const encounter = await Encounter.create({
    ...fake(Encounter),
    type: ENCOUNTER_TYPES.CLINIC,
    examinerId: chance.pickone(setupData.examiners).id,
    patientId,
    locationId: location.id,
    departmentId: department.id,
  });
  return encounter;
};
