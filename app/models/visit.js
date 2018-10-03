const moment = require('moment');

const VisitSchema = {
  name: 'visit',
  properties: {
    dischargeInfo: {
      type: 'string',
      optional: true
    },
    startDate: {
      type: 'date',
      default: moment()
    },
    endDate: 'date', // if visit type is outpatient, startDate and endDate are equal
    examiner: {
      type: 'string',
      optional: true
    },
    hasAppointment: {
      type: 'bool',
      default: false
    },
    location: {
      type: 'string',
      optional: true
    },
    outPatient: {
      type: 'bool',
      default: false
    },
    reasonForVisit: {
      type: 'string',
      optional: true
    },
    status: {
      type: 'string',
      optional: true
    },
    visitType: {
      type: 'string',
      optional: true
    },

    //  Relation fields
    medication: {
      type: 'list',
      objectType: 'medication'
    },
    diagnoses: {
      type: 'list',
      objectType: 'diagnosis'
    },
    labs: {
      type: 'list',
      objectType: 'lab'
    },
    notes: {
      type: 'list',
      objectType: 'note'
    },
    procedures: {
      type: 'list',
      objectType: 'procedure'
    },
    vitals: {
      type: 'list',
      objectType: 'vitals'
    },
    reports: {
      type: 'list',
      objectType: 'report'
    },
  }
};

module.exports = VisitSchema;
