const PregnancySchema = {
  name: 'pregnancy',
  properties: {
    conceiveDate: 'date', // estimated
    deliveryDate: 'date', // estimated
    child: {
      type: 'string',
      optional: true
    },
    father: {
      type: 'string',
      optional: true
    }, // biological father
    outcome: {
      type: 'string',
      optional: true
    },
    gestationalAge: {
      type: 'string',
      optional: true
    },
    surveyResponses: {
      type: 'list',
      objectType: 'surveyResponse'
    },
  }
};

module.exports = PregnancySchema;
