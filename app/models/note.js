const moment = require('moment');

const NoteSchema = {
  name: 'note',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    attribution: {
      type: 'string',
      optional: true
    },
    content: {
      type: 'string',
      optional: true
    },
    createdBy: {
      type: 'string',
      optional: true
    },
    date: {
      type: 'date',
      default: moment()
    },
    noteType: {
      type: 'string',
      optional: true
    }
  }
};

module.exports = NoteSchema;
