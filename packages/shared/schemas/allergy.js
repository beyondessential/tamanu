import defaults from './defaults';

export const AllergySchema = {
  name: 'allergy',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      indexed: true,
    },
    icd9CMCode: {
      type: 'string',
      optional: true,
    },
    icd10Code: {
      type: 'string',
      optional: true,
    },
    ...defaults,
  },
};
