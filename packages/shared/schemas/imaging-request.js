import defaults from './defaults';
import { IMAGING_REQUEST_STATUSES } from '../constants';

export const ImagingRequestSchema = {
  name: 'imagingRequest',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date?',
    type: 'imagingType',
    detail: 'string?',
    location: 'string?',
    diagnosis: 'diagnosis?',
    notes: 'string?',
    imageSource: 'string?',
    status: {
      type: 'string',
      optional: true,
      default: IMAGING_REQUEST_STATUSES.PENDING,
    },
    requestedBy: 'user',
    requestedDate: 'date',
    reviewedBy: 'user?',
    reviewedDate: 'date?',
    visit: {
      type: 'linkingObjects',
      objectType: 'visit',
      property: 'imagingRequests',
    },
    ...defaults,
  },
};
