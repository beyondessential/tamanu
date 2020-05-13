import defaults from './defaults';

export const medicationHistorySchema = {
  name: 'medicationHistory',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: {
      type: 'date',
      indexed: true,
    },
    morning: {
      type: 'bool',
      default: false,
    },
    lunch: {
      type: 'bool',
      default: false,
    },
    evening: {
      type: 'bool',
      default: false,
    },
    night: {
      type: 'bool',
      default: false,
    },
    markedBy: {
      type: 'string',
      optional: true,
    },
    ...defaults,
  },
};
