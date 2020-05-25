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
    temperature: 'double?',
    weight: 'double?',
    height: 'double?',
    sbp: 'double?',
    dbp: 'double?',
    heartRate: 'double?',
    respiratoryRate: 'double?',
    svo2: 'double?',
    avpu: 'string?',
    ...defaults,
  },
};
