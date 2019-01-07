const { parseInt, padStart } = require('lodash');
const defaults = require('./defaults');

const PatientSchema = {
  name: 'patient',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    displayId: {
      type: 'string',
      optional: true,
      indexed: true
    },
    admitted: {
      type: 'bool',
      default: false
    },
    address: {
      type: 'string',
      optional: true
    },
    address2: {
      type: 'string',
      optional: true
    },
    address3: {
      type: 'string',
      optional: true
    },
    address4: {
      type: 'string',
      optional: true
    },
    bloodType: {
      type: 'string',
      optional: true
    },
    clinic: {
      type: 'string',
      optional: true
    },
    country: {
      type: 'string',
      optional: true
    },
    checkedIn: {
      type: 'bool',
      default: false
    },
    dateOfBirth: 'date',
    economicClassification: {
      type: 'string',
      optional: true
    },
    email: {
      type: 'string',
      optional: true
    },
    externalPatientId: {
      type: 'string',
      optional: true
    },
    familySupport1: {
      type: 'string',
      optional: true
    },
    familySupport2: {
      type: 'string',
      optional: true
    },
    familySupport3: {
      type: 'string',
      optional: true
    },
    familySupport4: {
      type: 'string',
      optional: true
    },
    familySupport5: {
      type: 'string',
      optional: true
    },
    // familyInfo: 'string[]',
    firstName: {
      type: 'string',
      optional: true,
      indexed: true
    },
    sex: {
      type: 'string',
      optional: true,
      indexed: true
    },
    occupation: {
      type: 'string',
      optional: true
    },
    history: {
      type: 'string',
      optional: true
    }, // No longer used
    insurance: {
      type: 'string',
      optional: true
    },
    lastName: {
      type: 'string',
      optional: true,
      indexed: true
    },
    livingArrangement: {
      type: 'string',
      optional: true
    },
    middleName: {
      type: 'string',
      optional: true,
      indexed: true
    },
    culturalName: {
      type: 'string',
      optional: true
    },
    notes: {
      type: 'string',
      optional: true
    },
    otherIncome: {
      type: 'string',
      optional: true
    },
    patientType: {
      type: 'string',
      optional: true
    },
    parent: {
      type: 'string',
      optional: true
    },
    phone: {
      type: 'string',
      optional: true,
      indexed: true
    },
    placeOfBirth: {
      type: 'string',
      optional: true
    },
    referredDate: {
      type: 'date',
      optional: true
    },
    referredBy: {
      type: 'string',
      optional: true
    },
    religion: {
      type: 'string',
      optional: true
    },
    socialActionTaken: {
      type: 'string',
      optional: true
    },
    socialRecommendation: {
      type: 'string',
      optional: true
    },
    status: {
      type: 'string',
      optional: true,
      indexed: true
    },

    appointments: {
      type: 'list',
      objectType: 'appointment'
    },
    additionalContacts: {
      type: 'list',
      objectType: 'patientContact'
    },
    allergies: {
      type: 'list',
      objectType: 'allergy'
    },
    diagnoses: {
      type: 'list',
      objectType: 'diagnosis'
    },
    operationReports: {
      type: 'list',
      objectType: 'operationReport'
    },
    operativePlans: {
      type: 'list',
      objectType: 'operationPlan'
    },
    pregnancies: {
      type: 'list',
      objectType: 'pregnancy'
    },
    surveyResponses: {
      type: 'list',
      objectType: 'surveyResponse'
    },
    visits: {
      type: 'list',
      objectType: 'visit'
    },
  }, defaults),
  beforeSave: (db, object) => {
    if (object.displayId === '') object.displayId = _generateTempDisplayId(db);
    return object;
  },
  selectors: ['displayId', 'firstName', 'lastName', 'dateOfBirth', 'sex', 'status', 'admitted']
};

const _generateTempDisplayId = (db) => {
  let idSeq = db.getSetting('TEMP_DISPLAY_ID_SEQ');
  idSeq = parseInt(idSeq);
  idSeq += 1;
  const newId = `TMP${padStart(idSeq, 5, '0')}`;
  db.setSetting('TEMP_DISPLAY_ID_SEQ', idSeq);
  return newId;
};

module.exports = PatientSchema;
