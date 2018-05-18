const { Collection } = require('backbone');
const PouchDB = require('pouchdb');
const Patient = require('../models/patient');
const BackbonePouch = require('backbone-pouch');
const { map } = require('lodash');
const _ = require('underscore');
// const dbs = require('../utils/dbHelper');

const Patients = Collection.extend({
  model: Patient,

  parse: (result) => {
    return map(result.rows, obj => obj.doc);
  }
});

module.exports = Patients;
