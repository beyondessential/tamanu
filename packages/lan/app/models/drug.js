const DrugSchema = {
  name: 'drug',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true
    },
    code: {
      type: 'string',
      optional: true
    },
    unit: {
      type: 'string',
      optional: true
    },
  }
};

module.exports = DrugSchema;
