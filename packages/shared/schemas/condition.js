const defaults = require('./defaults');

const DiagnosisSchema = {
  name: 'condition',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    date: 'date',
    condition: 'string',
    diagnosis: {
      type: 'linkingObjects',
      objectType: 'diagnosis',
      property: 'condition'
    }
  }, defaults)
};

module.exports = DiagnosisSchema;
