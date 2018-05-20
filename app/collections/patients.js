import BackbonePouch from 'backbone-pouch';

const Backbone = require('backbone');
const { PatientModel } = require('../models');
const { map } = require('lodash');
const { patientDB } = require('../utils/dbHelper');

const Patients = Backbone.Collection.extend({
  model: PatientModel,
  sync: BackbonePouch.sync({
    db: patientDB,
    fetch: 'query',
    options: {
      query: {
        include_docs: true,
        fun: 'patient_by_display_id'
      },
      changes: {
        include_docs: true
      }
    },
  }),
  parse: (result) => {
    return map(result.rows, obj => obj.doc);
  }
});

module.exports = Patients;
