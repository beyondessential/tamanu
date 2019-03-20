import defaults from './defaults';

export const PatientContactSchema = {
  name: 'patientContact',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true,
    },
    phone: {
      type: 'string',
      optional: true,
    },
    email: {
      type: 'string',
      optional: true,
    },
    relationship: {
      type: 'string',
      optional: true,
    },
    ...defaults,
  },
};
