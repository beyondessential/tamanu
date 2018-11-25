const moment = require('moment');

const VitalSchema = {
  name: 'vitals',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    dateRecorded: {
      type: 'date',
      default: moment()
    },
    temperature: {
      type: 'string',
      optional: true
    },
    weight: {
      type: 'string',
      optional: true
    },
    height: {
      type: 'string',
      optional: true
    },
    sbp: {
      type: 'string',
      optional: true
    },
    dbp: {
      type: 'string',
      optional: true
    },
    heartRate: {
      type: 'string',
      optional: true
    },
    respiratoryRate: {
      type: 'string',
      optional: true
    },
  }
};

module.exports = VitalSchema;
