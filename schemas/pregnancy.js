const defaults = require('./defaults');

const PregnancySchema = {
  name: 'pregnancy',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    conceiveDate: {
      type: 'date',
      optional: true,
      indexed: true
    }, // estimated
    deliveryDate: {
      type: 'date',
      optional: true,
      indexed: true
    }, // estimated
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
  }, defaults)
};

module.exports = PregnancySchema;
