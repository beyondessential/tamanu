const defaults = require('./defaults');

const AppointmentSchema = {
  name: 'appointment',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    allDay: 'bool',
    provider: {
      type: 'string',
      optional: true
    },
    location: {
      type: 'string',
      optional: true
    },
    appointmentType: {
      type: 'string',
      optional: true
    },
    startDate: {
      type: 'date',
      optional: true
    },
    endDate: {
      type: 'date',
      optional: true
    },
    notes: {
      type: 'string',
      optional: true
    },
    status: {
      type: 'string',
      optional: true
    },
    visits: {
      type: 'list',
      objectType: 'visit'
    }
  }, defaults)
};

module.exports = AppointmentSchema;
