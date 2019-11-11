import { parseInt, padStart } from 'lodash';
import defaults from './defaults';
import { DISPLAY_ID_PLACEHOLDER, ENVIRONMENT_TYPE } from '../constants';

export const PatientSchema = {
  name: 'patient',
  primaryKey: '_id',
  properties: {
    // primary fields
    _id: 'string',
    displayId: 'string',
    firstName: { type: 'string', optional: true, indexed: true },
    middleName: { type: 'string', optional: true, indexed: true },
    lastName: { type: 'string', optional: true, indexed: true },
    culturalName: { type: 'string', optional: true },
    dateOfBirth: 'date',
    sex: { type: 'string', optional: true, indexed: true },

    // additional info
    religion: { type: 'string', optional: true },
    bloodType: { type: 'string', optional: true },
    occupation: { type: 'string', optional: true },
    // mother: {},
    // father: {},
    externalPatientId: { type: 'string', optional: true },
    patientType: { type: 'string', optional: true },
    placeOfBirth: { type: 'string', optional: true },
    referredDate: { type: 'date', optional: true },
    referredBy: { type: 'string', optional: true },

    // has-many
    appointments: { type: 'list', objectType: 'appointment' },
    triages: { type: 'list', objectType: 'triage' },
    visits: { type: 'list', objectType: 'visit' },
    referrals: { type: 'list', objectType: 'referral' },
    allergies: { type: 'list', objectType: 'patientAllergy' },
    conditions: { type: 'list', objectType: 'condition' },
    issues: { type: 'list', objectType: 'issue' },

    additionalContacts: { type: 'list', objectType: 'patientContact' },
    pregnancies: { type: 'list', objectType: 'pregnancy' },
    surveyResponses: { type: 'list', objectType: 'surveyResponse' },
    familyHistory: { type: 'list', objectType: 'familyHistoryItem' },

    death: 'death?',

    ...defaults,
  },
  beforeSave: (db, object, env) => {
    let displayId = object.displayId;
    if (object.displayId === DISPLAY_ID_PLACEHOLDER && env === ENVIRONMENT_TYPE.LAN) {
      displayId = generateTempDisplayId(db);
    }

    return { ...object, displayId };
  },
  selectors: ['displayId', 'firstName', 'lastName', 'dateOfBirth', 'sex', 'status', 'admitted'],
};

const generateTempDisplayId = db => {
  let idSeq = db.getSetting('TEMP_DISPLAY_ID_SEQ');
  idSeq = parseInt(idSeq);
  idSeq += 1;
  const newId = `TMP${padStart(idSeq, 5, '0')}`;
  db.setSetting('TEMP_DISPLAY_ID_SEQ', idSeq);
  return newId;
};
