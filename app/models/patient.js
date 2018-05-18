const PouchDB = require('pouchdb');
const { Model } = require('backbone');
const BackbonePouch = require('backbone-pouch');
// const dbs = require('../utils/dbHelper');

const Patient = Model.extend({
  validate: (attrs, options) => {
    console.log('validate', attrs);
    if (attrs.firstName === '') return 'firstName is required!';
    if (attrs.lastName === '') return 'lastName is required!';
  },

  idAttribute: '_id',
  defaults: {
    admitted: false,
    additionalContacts: [],
    address: '',
    address2: '',
    address3: '',
    address4: '',
    bloodType: '',
    clinic: '',
    country: '',
    checkedIn: false,
    customForms: {},
    dateOfBirth: Date,
    economicClassification: '',
    email: '',
    expenses: [],
    externalPatientId: '',
    familySupport1: '',
    familySupport2: '',
    familySupport3: '',
    familySupport4: '',
    familySupport5: '',
    friendlyId: '',
    familyInfo: [],
    firstName: '',
    sex: '',
    occupation: '',
    history: '', // No longer used
    insurance: '',
    lastName: '',
    livingArrangement: '',
    middleName: '',
    notes: '',
    otherIncome: '',
    patientType: '',
    parent: '',
    phone: '',
    placeOfBirth: '',
    referredDate: Date,
    referredBy: '',
    religion: '',
    socialActionTaken: '',
    socialRecommendation: '',
    status: '',
    // Associations
    // allergies: DS.hasMany('allergy', { async: true }),
    // diagnoses: DS.hasMany('diagnosis', { async: false }),
    // operationReports: DS.hasMany('operation-report', { async: true }),
    // operativePlans: DS.hasMany('operative-plan', { async: true }),
    // payments: DS.hasMany('payment', { async: true }),
    // paymentProfile: DS.belongsTo('price-profile', { async: false }),
  },

});

module.exports = Patient;
