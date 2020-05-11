import defaults from './defaults';

export const DiagnosisSchema = {
  name: 'diagnosis',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      indexed: true,
    },
    code: {
      type: 'string',
      indexed: true,
    },
    type: {
      type: 'string',
      indexed: true,
      default: 'icd10',
    },
    ...defaults,
  },
};
