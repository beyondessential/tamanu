import { fake } from 'shared/test-helpers';
import { NUM_EXAMINERS, REF_ID_PREFIX } from '../constants';

export default {
  run: async store => {
    const { User } = store.models;
    const examiners = [];
    for (let i = 0; i < NUM_EXAMINERS; i++) {
      const [examiner] = await User.upsert(
        {
          ...fake(User),
          role: 'practitioner',
          id: `${REF_ID_PREFIX}-user-${i}`,
        },
        { returning: true },
      );
      examiners.push(examiner);
    }
    return examiners;
  },
};
