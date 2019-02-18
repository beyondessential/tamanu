const defaults = require('./defaults');

const VisitSchema = {
  name: 'visit',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    dischargeInfo: {
      type: 'string',
      optional: true
    },
    startDate: {
      type: 'date',
      default: new Date(),
      indexed: true
    },
    // if visit type is outpatient, startDate and endDate are equal
    endDate: {
      type: 'date',
      optional: true,
      indexed: true
    },
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
      optional: true,
      indexed: true
    },
    visitType: {
      type: 'string',
      optional: true,
      indexed: true
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
    ...defaults,
  }
};

module.exports = VisitSchema;
