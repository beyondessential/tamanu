const AppointmentSchema = {
  name: 'appointment',
  properties: {
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
    startDate: 'date',
    endDate: 'date',
    notes: {
      type: 'string',
      optional: true
    },
    status: {
      type: 'string',
      optional: true
    },
    patient: {
      type: 'string',
      optional: true
    },
    // visits: {
    //   type: 'list',
    //   objectType: 'Visit'
    // }
  }
};

module.exports = AppointmentSchema;