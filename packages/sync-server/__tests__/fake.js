import { random, sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import {
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  REFERENCE_TYPES,
  REFERENCE_TYPE_VALUES,
} from 'shared/constants';

export function fakeStringFields(prefix, fields) {
  return fields.reduce(
    (obj, field) => ({
      ...obj,
      [field]: prefix + field,
    }),
    {},
  );
}

export function fakePatient(prefix = '') {
  const id = uuidv4();
  return {
    id,
    ...fakeStringFields(`${prefix}patient_${id}_`, [
      'firstName',
      'middleName',
      'lastName',
      'culturalName',
      'displayId',
    ]),
    sex: sample(['male', 'female', 'other']),
    bloodType: sample(['A', 'B', 'AB', 'O']) + sample(['+', '-']),
    dateOfBirth: new Date(random(0, Date.now())),
    villageId: null,
  };
}

export function fakeScheduledVaccine(prefix = '') {
  const id = uuidv4();
  return {
    id,
    vaccineId: null,
    ...fakeStringFields(`${prefix}scheduledVaccine_${id}_`, ['category', 'label', 'schedule']),
  };
}

export function fakeSurvey(prefix = '') {
  const id = uuidv4();
  return {
    id,
    programId: null,
    ...fakeStringFields(`${prefix}survey_${id}_`, ['code', 'name']),
  };
}

export function fakeSurveyScreenComponent(prefix = '') {
  const id = uuidv4();
  return {
    id,
    surveyId: null,
    dataElementId: null,
    screenIndex: random(0, 100),
    componentIndex: random(0, 100),
    options: '{"foo":"bar"}',
    ...fakeStringFields(`${prefix}surveyScreenComponent_${id}_`, ['text', 'visibilityCriteria']),
  };
}

export function fakeProgramDataElement(prefix = '') {
  const id = uuidv4();
  return {
    id,
    type: sample(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
    ...fakeStringFields(`${prefix}programDataElement_${id}_`, [
      'code',
      'name',
      'indicator',
      'defaultText',
      'defaultOptions',
    ]),
  };
}

export function fakeReferenceData(prefix = '') {
  const id = uuidv4();
  return {
    id,
    type: sample(REFERENCE_TYPE_VALUES),
    ...fakeStringFields(`${prefix}referenceData_${id}_`, ['name', 'code']),
  };
}

export function fakeUser(prefix = '') {
  const id = uuidv4();
  return {
    id,
    password: null, // don't set a password for these fake users - it's easier to test, and is still a valid state
    ...fakeStringFields(`${prefix}user_${id}_`, ['email', 'displayName', 'role']),
  };
}

export function fakeProgram(prefix = '') {
  const id = uuidv4();
  return {
    id,
    ...fakeStringFields(`${prefix}program_${id})`, ['name', 'code']),
  };
}

export function fakeAdministeredVaccine(prefix = '') {
  const id = uuidv4();
  return {
    data: {
      id,
      encounterId: null,
      scheduledVaccineId: null,
      date: new Date(random(0, Date.now())),
      ...fakeStringFields(`${prefix}administeredVaccine_${id})`, [
        'batch',
        'status',
        'reason',
        'location',
      ]),
    },
  };
}
