const defaults = require('./defaults');

const ImagingRequestSchema = {
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
    status: 'string?',
    requestedBy: 'user',
    requestedDate: 'date',
    reviewedBy: 'user',
    reviewedDate: 'date',
    visit: {
      type: 'linkingObjects',
      objectType: 'visit',
      property: 'imagingRequests'
    },
    ...defaults,
  }
};

module.exports = ImagingRequestSchema;
