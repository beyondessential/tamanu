import BackbonePouch from 'backbone-pouch';
import Backbone from 'backbone';
import { map } from 'lodash';
import { patientDB } from '../utils/dbHelper';
import { PatientModel } from '../models';

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
