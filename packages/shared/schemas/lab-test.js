const defaults = require('./defaults');
const { LAB_REQUEST_STATUSES } = require('../constants');

const LabTestSchema = {
  name: 'labTest',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    type: 'labTestType',
    result: 'string?',
    senaiteId: 'string?',
    status: { type: 'string', default: LAB_REQUEST_STATUSES.RECEPTION_PENDING },
    ...defaults,
  },
};

module.exports = LabTestSchema;
