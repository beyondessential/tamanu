import defaults from './defaults';
import { LAB_REQUEST_STATUSES } from '../constants';

export const LabRequest = {
  name: 'labRequest',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date?',
    requestedBy: 'user',
    requestedDate: 'date',
    sampleTime: 'date?',
    category: 'labTestCategory',
    senaiteId: 'string?',
    sampleId: 'string?',
    notes: 'string?',
    urgent: { type: 'bool', default: false },
    specimenAttached: { type: 'bool', default: false },
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
