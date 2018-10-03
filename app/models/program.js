const ProgramSchema = {
  name: 'program',
  properties: {
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
