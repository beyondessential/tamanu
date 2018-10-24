const defaults = require('./defaults');

const ProcedureSchema = {
  name: 'procedure',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    anesthesiaType: {
      type: 'string',
      optional: true
    },
    anesthesiologist: {
      type: 'string',
      optional: true
    },
    assistant: {
      type: 'string',
      optional: true
    },
    description: {
      type: 'string',
      optional: true
    },
    cptCode: {
      type: 'string',
      optional: true
    },
    location: {
      type: 'string',
      optional: true
    },
    notes: {
      type: 'string',
      optional: true
    },
    physician: {
      type: 'string',
      optional: true
    },
    procedureDate: {
      type: 'date',
      default: new Date()
    },
    timeStarted: {
      type: 'string',
      optional: true
    },
    timeEnded: {
      type: 'string',
      optional: true
    },

    medication: {
      type: 'list',
      objectType: 'procedureMedication'
    },
  }, defaults)
};

module.exports = ProcedureSchema;
