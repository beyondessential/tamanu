const defaults = require('./defaults');

const medicationHistorySchema = {
  name: 'medicationHistory',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    date: 'date',
    morning: {
      type: 'bool',
      default: false
    },
    lunch: {
      type: 'bool',
      default: false
    },
    evening: {
      type: 'bool',
      default: false
    },
    night: {
      type: 'bool',
      default: false
    },
    markedBy: {
      type: 'string',
      optional: true
    },
  }, defaults)
};

module.exports = medicationHistorySchema;
