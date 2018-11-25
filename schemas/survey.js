const defaults = require('./defaults');

const SurveySchema = {
  name: 'survey',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    name: {
      type: 'string',
      optional: true
    },
    code: {
      type: 'string',
      optional: true
    },
    imageData: {
      type: 'string',
      optional: true
    },
    permissionGroupId: {
      type: 'string',
      optional: true
    },
    surveyGroupId: {
      type: 'string',
      optional: true
    },
    screens: {
      type: 'list',
      objectType: 'surveyScreen'
    },
    canRedo: { // Can submit multiple times
      type: 'bool',
      default: false
    },
    order: {
      type: 'int',
      default: 0
    }
  }, defaults)
};

module.exports = SurveySchema;
