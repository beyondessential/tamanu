const LabSchema = {
  name: 'lab',
  properties: {
    labDate: 'date',
    notes: {         type: 'string',         optional: true       },
    requestedBy: {         type: 'string',         optional: true       },
    requestedDate: 'date',
    result: {         type: 'string',         optional: true       },
    status: {         type: 'string',         optional: true       }
  }
};

module.exports = LabSchema;
