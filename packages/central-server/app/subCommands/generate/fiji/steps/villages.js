import { chance } from '../../chance';
import { NUM_VILLAGES, REF_ID_PREFIX } from '../constants';

export default {
  run: async store => {
    const { ReferenceData } = store.models;
    const villages = [];
    for (let i = 0; i < NUM_VILLAGES; i++) {
      const name = chance.city();
      const code = name.toLowerCase();
      const id = `${REF_ID_PREFIX}-village-${i}`;
      const village = await ReferenceData.upsert(
        { id, code, name, type: 'village' },
        { returning: true },
      );
      villages.push(village);
    }
    return villages;
  },
};
