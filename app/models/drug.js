const DrugSchema = {
  name: 'drug',
  properties: {
    name: {         type: 'string',         optional: true       },
    code: {         type: 'string',         optional: true       },
    unit: {         type: 'string',         optional: true       },
  }
};

module.exports = DrugSchema;
