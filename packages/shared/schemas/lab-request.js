import defaults from './defaults';
const { LAB_REQUEST_STATUSES } = require('../constants');

export const LabRequest = {
  name: 'labRequest',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date?',
    requestedBy: 'user',
    requestedDate: 'date',
    category: 'labTestCategory',
    senaiteId: 'string?',
    sampleId: 'string?',
    notes: 'string?',
    status: {
      type: 'string',
      optional: true,
      default: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
    },
    tests: {
      type: 'list',
      objectType: 'labTest',
    },
    visits: {
      type: 'linkingObjects',
      objectType: 'visit',
      property: 'labRequests',
    },
    ...defaults,
  },
};
