const moment = require('moment');

const ProcedureSchema = {
  name: 'procedure',
  properties: {
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
      default: moment()
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
  }
};

module.exports = ProcedureSchema;
