import defaults from './defaults';

export const VitalSchema = {
  name: 'vitals',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    dateRecorded: {
      type: 'date',
      default: new Date(),
      indexed: true,
    },
    temperature: {
      type: 'double',
      optional: true,
    },
    weight: {
      type: 'double',
      optional: true,
    },
    height: {
      type: 'double',
      optional: true,
    },
    sbp: {
      type: 'double',
      optional: true,
    },
    dbp: {
      type: 'double',
      optional: true,
    },
    heartRate: {
      type: 'double',
      optional: true,
    },
    respiratoryRate: {
      type: 'double',
      optional: true,
    },
    ...defaults,
  },
};
