import defaults from './defaults';

export const ConditionsSchema = {
  name: 'condition',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    condition: 'string',
    diagnosis: {
      type: 'linkingObjects',
      objectType: 'patientDiagnosis',
      property: 'condition',
    },
    ...defaults,
  },
};
