const defaults = require('./defaults');

const ImagingTypeSchema = {
  name: 'imagingType',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    sortOrder: {
      type: 'int',
      default: 0
    },
    ...defaults,
  }
};

module.exports = ImagingTypeSchema;
