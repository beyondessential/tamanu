const defaults = require('./defaults');

const SurveyGroupSchema = {
  name: 'surveyGroup',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true,
    },
    ...defaults,
  },
};

module.exports = SurveyGroupSchema;
