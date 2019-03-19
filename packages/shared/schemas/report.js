const defaults = require('./defaults');

const ReportSchema = {
  name: 'report',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    reportDate: {
      type: 'date',
      optional: true,
    },
    reportType: {
      type: 'string',
      optional: true,
    },
    ...defaults,
  },
};

module.exports = ReportSchema;
