const ReportSchema = {
  name: 'report',
  properties: {
    reportDate: 'date',
    reportType: {
      type: 'string',
      optional: true
    },
  }
};

module.exports = ReportSchema;
