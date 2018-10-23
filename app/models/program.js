const ProgramSchema = {
  name: 'program',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true
    },
    programType: {
      type: 'string',
      default: 'direct'
    },
    surveys: {
      type: 'list',
      objectType: 'survey'
    }
  }
};

module.exports = ProgramSchema;
