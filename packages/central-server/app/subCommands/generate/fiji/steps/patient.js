import { fake } from '@tamanu/data-generation/helpers';
import { chance } from '../../chance';

export default {
  setup: ['villages'],
  run: (store, setupData) => {
    const { Patient } = store.models;
    return Patient.create({
      ...fake(Patient),
      villageId: chance.pickone(setupData.villages).id,
    });
  },
};
